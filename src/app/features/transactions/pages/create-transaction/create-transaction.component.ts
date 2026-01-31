import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { form, FormField, maxLength, min, minLength, required } from '@angular/forms/signals';
import { Router, ActivatedRoute } from '@angular/router';
import { TitleCasePipe } from '@angular/common';
import {
  CustomerStateService,
  TransactionType,
  TransactionCategory,
  DraftTransaction,
  BUSINESS_RULES
} from '@core/index';
import { TransactionService } from '../../services/transaction.service';
import {
  CardComponent,
  ButtonComponent,
  ToastService
} from '@shared/index';
import { CurrencyFormatPipe } from '@shared/pipes';

interface TransactionFormData {
  type: TransactionType;
  amount: number;
  category: TransactionCategory | '';
  date: string;
  description: string;
}

@Component({
  selector: 'app-create-transaction',
  imports: [FormField, TitleCasePipe, CardComponent, ButtonComponent, CurrencyFormatPipe],
  templateUrl: './create-transaction.component.html',
  styleUrl: './create-transaction.component.css'
})
export class CreateTransactionComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly customerState = inject(CustomerStateService);
  readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly validationErrors = signal<{ code: string; message: string }[]>([]);

  readonly today = new Date().toISOString().split('T')[0];
  readonly minDate = this.customerState.selectedAccount()?.openingDate ?? this.today;

  readonly transactionModel = signal<TransactionFormData>({
    type: 'credit',
    amount: 0,
    category: '',
    date: this.today,
    description: ''
  });

  readonly transactionForm = form(this.transactionModel, (schemaPath) => {
    required(schemaPath.type);
    min(schemaPath.amount, 0.01, { message: 'Amount must be at least 0.01' });
    required(schemaPath.category, { message: 'Category is required' });
    required(schemaPath.date, { message: 'Date is required' });
    required(schemaPath.description, { message: 'Description is required' });
    minLength(schemaPath.description, 3, { message: 'Description must be at least 3 characters' });
    maxLength(schemaPath.description, 200, { message: 'Description cannot exceed 200 characters' });
  });

  readonly currencySymbol = computed(() => {
    const currency = this.customerState.selectedAccount()?.currency;
    const symbols: Record<string, string> = {
      EGP: 'E£',
      USD: '$',
      EUR: '€',
      GBP: '£',
      SAR: 'SR'
    };
    return symbols[currency ?? 'EGP'] ?? currency ?? 'E£';
  });

  readonly availableCategories = computed(() => {
    const type = this.transactionForm.type().value();
    const allCategories: TransactionCategory[] = [
      'salary', 'transfer', 'payment', 'withdrawal', 'deposit', 'income', 'fees', 'refund', 'other'
    ];
    if (type === 'credit') {
      return allCategories.filter(c => !BUSINESS_RULES.DEBIT_ONLY_CATEGORIES.includes(c));
    }
    return allCategories.filter(c => !BUSINESS_RULES.CREDIT_ONLY_CATEGORIES.includes(c));
  });

  readonly isScheduled = computed(() => {
    const date = this.transactionForm.date().value();
    return Boolean(date && date > this.today);
  });

  ngOnInit(): void {
    const resume = this.route.snapshot.queryParams['resume'];
    if (resume === 'true') {
      this.loadDraft();
    }
  }

  ngOnDestroy(): void {
    if (!this.isSubmitting() && this.transactionForm().dirty()) {
      this.autoSaveDraft();
    }
  }

  setType(type: TransactionType): void {
    const account = this.customerState.selectedAccount();
    if (type === 'debit' && account?.status === 'frozen') {
      return;
    }
    this.transactionForm.type().value.set(type);
    const cats = this.availableCategories();
    const currentCat = this.transactionForm.category().value();
    if (currentCat && !cats.includes(currentCat as TransactionCategory)) {
      this.transactionForm.category().value.set('');
    }
  }

  loadDraft(): void {
    const draft = this.transactionService.getDraft();
    if (draft) {
      this.transactionModel.set({
        type: (draft.type ?? 'credit') as TransactionType,
        amount: draft.amount ?? 0,
        category: (draft.category ?? '') as TransactionFormData['category'],
        date: draft.date ?? this.today,
        description: draft.description ?? ''
      });
      this.toast.info('Draft loaded');
    }
  }

  saveDraft(): void {
    const data = this.transactionModel();
    const draft: DraftTransaction = {
      accountId: this.customerState.selectedAccountId() ?? undefined,
      type: data.type,
      amount: data.amount ?? undefined,
      category: data.category || undefined,
      date: data.date || undefined,
      description: data.description || undefined,
      savedAt: new Date().toISOString()
    };
    this.transactionService.saveDraft(draft);
    this.toast.success('Draft saved');
  }

  private autoSaveDraft(): void {
    const data = this.transactionModel();
    if (data.amount > 0 || data.description) {
      this.saveDraft();
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.transactionForm().invalid()) {
      return;
    }

    this.isSubmitting.set(true);
    this.validationErrors.set([]);

    const { type, amount, category, date, description } = this.transactionModel();

    const result = this.transactionService.createTransaction(
      type,
      category as TransactionCategory,
      amount ?? 0,
      description,
      date
    );

    if (result.success) {
      const message = this.isScheduled()
        ? 'Transaction scheduled successfully'
        : 'Transaction created successfully';
      this.toast.showWithUndo(message, () => {
        this.transactionService.undoLastTransaction();
      });
      this.router.navigate(['/transactions']);
    } else {
      this.validationErrors.set(result.errors ?? []);
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }
}
