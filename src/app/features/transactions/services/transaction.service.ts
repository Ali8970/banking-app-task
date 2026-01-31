import { Injectable, inject, signal, computed } from '@angular/core';
import { 
  DataLoaderService, 
  CustomerStateService, 
  LoggerService,
  StorageService,
  Transaction, 
  TransactionType,
  TransactionCategory,
  TransactionStatus,
  TransactionValidationError,
  DraftTransaction,
  Account,
  BUSINESS_RULES
} from '@core/index';

const DRAFT_KEY = 'transaction_draft';

@Injectable({
  providedIn: 'root'
})
export class TransactionService {
  private readonly dataLoader = inject(DataLoaderService);
  private readonly customerState = inject(CustomerStateService);
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);

  private readonly _lastTransaction = signal<Transaction | null>(null);
  private readonly _canUndo = signal(false);
  private readonly _hasDraft = signal(false);

  readonly lastTransaction = this._lastTransaction.asReadonly();
  readonly canUndo = this._canUndo.asReadonly();
  readonly hasDraft = this._hasDraft.asReadonly();

  readonly accountTransactions = computed(() => {
    const accountId = this.customerState.selectedAccountId();
    if (!accountId) return [];
    
    return this.dataLoader.transactions()
      .filter(t => t.accountId === accountId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }  );

  readonly completedTransactions = computed(() =>
    this.accountTransactions().filter(t => t.status === 'completed')
  );

  readonly scheduledTransactions = computed(() => 
    this.accountTransactions().filter(t => t.status === 'scheduled')
  );

  readonly accountBalance = computed(() => {
    const account = this.customerState.selectedAccount();
    if (!account) return 0;
    
    return this.calculateBalance(account, this.completedTransactions());
  });

  readonly todayDebitTotal = computed(() => {
    const accountId = this.customerState.selectedAccountId();
    if (!accountId) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    return this.completedTransactions()
      .filter(t => t.type === 'debit' && t.date.startsWith(today))
      .reduce((sum, t) => sum + t.amount, 0);
  });

  readonly remainingDailyLimit = computed(() => 
    Math.max(0, BUSINESS_RULES.DAILY_DEBIT_LIMIT - this.todayDebitTotal())
  );

  readonly todayTransactionCount = computed(() => {
    const accountId = this.customerState.selectedAccountId();
    if (!accountId) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    return this.completedTransactions()
      .filter(t => t.date.startsWith(today))
      .length;
  });

  constructor() {
    this.checkForDraft();
  }

  calculateBalance(account: Account, transactions: Transaction[]): number {
    let balance = account.openingBalance;
    
    for (const txn of transactions) {
      if (txn.status !== 'completed') continue;
      
      if (txn.type === 'credit') {
        balance += txn.amount;
      } else {
        balance -= txn.amount;
      }
    }
    
    return balance;
  }

  validateTransaction(
    amount: number,
    type: TransactionType,
    category: TransactionCategory,
    date: string,
    account: Account | null
  ): TransactionValidationError[] {
    const errors: TransactionValidationError[] = [];

    // Account validation
    if (!account) {
      errors.push({ code: 'NO_ACCOUNT', message: 'Please select an account' });
      return errors;
    }

    if (account.status === 'inactive') {
      errors.push({ 
        code: 'ACCOUNT_INACTIVE', 
        message: 'Transactions are disabled for inactive accounts' 
      });
      return errors;
    }

    if (account.status === 'frozen' && type === 'debit') {
      errors.push({ 
        code: 'ACCOUNT_FROZEN', 
        message: 'Debit transactions are disabled for frozen accounts. Only credits are allowed.' 
      });
    }

    if (amount <= 0) {
      errors.push({ 
        code: 'INVALID_AMOUNT', 
        message: 'Amount must be greater than zero',
        field: 'amount'
      });
    }

    const txnDate = new Date(date);
    const openingDate = new Date(account.openingDate);
    txnDate.setHours(0, 0, 0, 0);
    openingDate.setHours(0, 0, 0, 0);
    
    if (txnDate < openingDate) {
      errors.push({ 
        code: 'DATE_BEFORE_OPENING', 
        message: `Transaction date cannot be before account opening date (${account.openingDate})`,
        field: 'date'
      });
    }

    if (type === 'credit' && BUSINESS_RULES.DEBIT_ONLY_CATEGORIES.includes(category)) {
      errors.push({ 
        code: 'INVALID_CATEGORY', 
        message: `${category} category is only allowed for debit transactions`,
        field: 'category'
      });
    }

    if (type === 'debit' && BUSINESS_RULES.CREDIT_ONLY_CATEGORIES.includes(category)) {
      errors.push({ 
        code: 'INVALID_CATEGORY', 
        message: `${category} category is only allowed for credit transactions`,
        field: 'category'
      });
    }

    // Daily debit limit validation (only for completed transactions, not scheduled)
    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;
    
    if (type === 'debit' && isToday) {
      const newTotal = this.todayDebitTotal() + amount;
      if (newTotal > BUSINESS_RULES.DAILY_DEBIT_LIMIT) {
        const remaining = this.remainingDailyLimit();
        errors.push({
          code: 'DAILY_LIMIT_EXCEEDED',
          message: remaining <= 0
            ? `Daily debit limit of ${BUSINESS_RULES.DAILY_DEBIT_LIMIT.toLocaleString()} EGP exceeded. No remaining allowance today.`
            : `Daily debit limit of ${BUSINESS_RULES.DAILY_DEBIT_LIMIT.toLocaleString()} EGP exceeded. Reduce amount; remaining today: ${remaining.toLocaleString()} EGP`,
          field: 'amount'
        });
      }
    }

    if (isToday && this.todayTransactionCount() >= BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY) {
      errors.push({ 
        code: 'MAX_TRANSACTIONS_EXCEEDED', 
        message: `Maximum ${BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY} transactions per day exceeded`
      });
    }

    return errors;
  }

  createTransaction(
    type: TransactionType,
    category: TransactionCategory,
    amount: number,
    description: string,
    date: string
  ): { success: boolean; transaction?: Transaction; errors?: TransactionValidationError[] } {
    const account = this.customerState.selectedAccount();
    const errors = this.validateTransaction(amount, type, category, date, account);
    if (errors.length > 0) {
      return { success: false, errors };
    }

    // Determine status based on date
    const today = new Date().toISOString().split('T')[0];
    const isScheduled = date > today;
    const status: TransactionStatus = isScheduled ? 'scheduled' : 'completed';

    const transaction: Transaction = {
      id: this.generateId(),
      accountId: account!.id,
      type,
      category,
      amount,
      currency: account!.currency,
      description,
      date,
      status,
      createdAt: new Date().toISOString(),
      reference: this.generateReference(type)
    };

    // Add to data loader
    this.dataLoader.addTransaction(transaction);

    // Enable undo for completed transactions
    if (status === 'completed') {
      this._lastTransaction.set(transaction);
      this._canUndo.set(true);
    }

    this.clearDraft();

    this.logger.info('Transaction created', { 
      id: transaction.id, 
      type, 
      amount, 
      status 
    }, 'TransactionService');

    return { success: true, transaction };
  }

  /**
   * Undo last transaction
   */
  undoLastTransaction(): boolean {
    const lastTxn = this._lastTransaction();
    if (!lastTxn || !this._canUndo()) {
      return false;
    }

    this.dataLoader.removeTransaction(lastTxn.id);
    this._lastTransaction.set(null);
    this._canUndo.set(false);

    this.logger.info('Transaction undone', { id: lastTxn.id }, 'TransactionService');
    return true;
  }

  processScheduledTransactions(): number {
    const today = new Date().toISOString().split('T')[0];
    let processed = 0;

    const scheduled = this.scheduledTransactions();
    for (const txn of scheduled) {
      if (txn.date <= today) {
        this.dataLoader.updateTransaction(txn.id, { status: 'completed' });
        processed++;
      }
    }

    if (processed > 0) {
      this.logger.info('Processed scheduled transactions', { count: processed }, 'TransactionService');
    }

    return processed;
  }

  saveDraft(draft: DraftTransaction): void {
    const draftWithTimestamp: DraftTransaction = {
      ...draft,
      savedAt: new Date().toISOString()
    };
    this.storage.setLocal(DRAFT_KEY, draftWithTimestamp);
    this._hasDraft.set(true);
    this.logger.debug('Draft saved', undefined, 'TransactionService');
  }

  /**
   * Get saved draft
   */
  getDraft(): DraftTransaction | null {
    return this.storage.getLocal<DraftTransaction>(DRAFT_KEY);
  }

  clearDraft(): void {
    this.storage.removeLocal(DRAFT_KEY);
    this._hasDraft.set(false);
    this.logger.debug('Draft cleared', undefined, 'TransactionService');
  }

  /**
   * Check if draft exists
   */
  private checkForDraft(): void {
    const draft = this.getDraft();
    this._hasDraft.set(!!draft);
  }

  clearUndoState(): void {
    this._lastTransaction.set(null);
    this._canUndo.set(false);
  }

  private generateId(): string {
    return 'txn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  }

  private generateReference(type: TransactionType): string {
    const prefix = type === 'credit' ? 'CR' : 'DR';
    const timestamp = Date.now().toString().slice(-8);
    return `${prefix}-${timestamp}`;
  }
}
