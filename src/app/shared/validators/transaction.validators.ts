import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { 
  Account, 
  TransactionType, 
  TransactionCategory, 
  BUSINESS_RULES,
  Transaction 
} from '@core/models';

/**
 * Transaction Validators - Business rule validators for transactions
 * Following Strategy Pattern - each validator is a pure function
 */

/**
 * Validates that amount is positive and within limits
 */
export function amountValidator(maxAmount?: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = control.value;
    
    if (value === null || value === undefined || value === '') {
      return null; // Let required validator handle empty
    }

    const amount = Number(value);
    
    if (isNaN(amount)) {
      return { invalidAmount: { message: 'Please enter a valid amount' } };
    }
    
    if (amount <= 0) {
      return { negativeAmount: { message: 'Amount must be greater than zero' } };
    }
    
    if (maxAmount && amount > maxAmount) {
      return { exceedsLimit: { message: `Amount cannot exceed ${maxAmount}`, limit: maxAmount } };
    }
    
    return null;
  };
}

/**
 * Validates daily debit limit
 */
export function dailyDebitLimitValidator(
  existingTransactions: Transaction[],
  accountId: string,
  transactionType: TransactionType
): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (transactionType !== 'debit') {
      return null;
    }

    const amount = Number(control.value);
    if (isNaN(amount) || amount <= 0) {
      return null;
    }

    const today = new Date().toISOString().split('T')[0];
    const todayDebits = existingTransactions
      .filter(t => 
        t.accountId === accountId && 
        t.type === 'debit' && 
        t.status === 'completed' &&
        t.date.startsWith(today)
      )
      .reduce((sum, t) => sum + t.amount, 0);

    const newTotal = todayDebits + amount;
    
    if (newTotal > BUSINESS_RULES.DAILY_DEBIT_LIMIT) {
      const remaining = Math.max(0, BUSINESS_RULES.DAILY_DEBIT_LIMIT - todayDebits);
      return { 
        dailyLimitExceeded: { 
          message: `Daily debit limit of ${BUSINESS_RULES.DAILY_DEBIT_LIMIT} EGP exceeded. Remaining: ${remaining} EGP`,
          limit: BUSINESS_RULES.DAILY_DEBIT_LIMIT,
          used: todayDebits,
          remaining
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validates max transactions per day
 */
export function maxTransactionsValidator(
  existingTransactions: Transaction[],
  accountId: string
): ValidatorFn {
  return (): ValidationErrors | null => {
    const today = new Date().toISOString().split('T')[0];
    const todayCount = existingTransactions.filter(t => 
      t.accountId === accountId && 
      t.status === 'completed' &&
      t.date.startsWith(today)
    ).length;

    if (todayCount >= BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY) {
      return { 
        maxTransactionsExceeded: { 
          message: `Maximum ${BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY} transactions per day exceeded`,
          limit: BUSINESS_RULES.MAX_TRANSACTIONS_PER_DAY,
          count: todayCount
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validates category matches transaction type
 * Income/Refund/Deposit → Credit only
 * Fees/Withdrawal/Payment → Debit only
 */
export function categoryTypeValidator(transactionType: TransactionType): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const category = control.value as TransactionCategory;
    
    if (!category) {
      return null;
    }

    if (transactionType === 'credit' && BUSINESS_RULES.DEBIT_ONLY_CATEGORIES.includes(category)) {
      return { 
        invalidCategoryForType: { 
          message: `${category} category is only allowed for debit transactions`,
          category,
          allowedType: 'debit'
        } 
      };
    }

    if (transactionType === 'debit' && BUSINESS_RULES.CREDIT_ONLY_CATEGORIES.includes(category)) {
      return { 
        invalidCategoryForType: { 
          message: `${category} category is only allowed for credit transactions`,
          category,
          allowedType: 'credit'
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validates transaction date is not before account opening date
 */
export function dateAfterOpeningValidator(account: Account | null): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!account || !control.value) {
      return null;
    }

    const transactionDate = new Date(control.value);
    const openingDate = new Date(account.openingDate);
    
    // Reset time parts for date comparison
    transactionDate.setHours(0, 0, 0, 0);
    openingDate.setHours(0, 0, 0, 0);

    if (transactionDate < openingDate) {
      return { 
        dateBeforeOpening: { 
          message: `Transaction date cannot be before account opening date (${account.openingDate})`,
          openingDate: account.openingDate
        } 
      };
    }
    
    return null;
  };
}

/**
 * Validates account status allows transaction
 */
export function accountStatusValidator(
  account: Account | null, 
  transactionType: TransactionType
): ValidationErrors | null {
  if (!account) {
    return { noAccount: { message: 'Please select an account' } };
  }

  if (account.status === 'inactive') {
    return { 
      accountInactive: { 
        message: 'Transactions are disabled for inactive accounts' 
      } 
    };
  }

  if (account.status === 'frozen' && transactionType === 'debit') {
    return { 
      accountFrozen: { 
        message: 'Debit transactions are disabled for frozen accounts. Only credits are allowed.' 
      } 
    };
  }

  return null;
}
