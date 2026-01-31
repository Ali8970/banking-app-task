import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
import { getErrorMessage } from '@shared/utils/error-map';
import { CurrencyFormatPipe } from '@shared/pipes';

/**
 * Create Transaction Component - Form for creating new transactions
 * 
 * Features:
 * - Real-time validation
 * - Draft save/resume
 * - Scheduled transactions (future dates)
 * - Business rule enforcement
 */
@Component({
  selector: 'app-create-transaction',
  imports: [ReactiveFormsModule, TitleCasePipe, CardComponent, ButtonComponent, CurrencyFormatPipe],
  templateUrl: './create-transaction.component.html',
  styleUrl: './create-transaction.component.css'
})
export class CreateTransactionComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  readonly customerState = inject(CustomerStateService);
  readonly transactionService = inject(TransactionService);
  private readonly toast = inject(ToastService);

  readonly isSubmitting = signal(false);
  readonly validationErrors = signal<{ code: string; message: string }[]>([]);

  readonly today = new Date().toISOString().split('T')[0];
  readonly minDate = this.customerState.selectedAccount()?.openingDate || this.today;

  form: FormGroup = this.fb.group({
    type: ['credit' as TransactionType, [Validators.required]],
    amount: [null, [Validators.required, Validators.min(0.01)]],
    category: ['', [Validators.required]],
    date: [this.today, [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]]
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
    return symbols[currency || 'EGP'] || currency || 'E£';
  });

  readonly availableCategories = computed(() => {
    const type = this.form.get('type')?.value as TransactionType;
    const allCategories: TransactionCategory[] = [
      'salary', 'transfer', 'payment', 'withdrawal', 'deposit', 'income', 'fees', 'refund', 'other'
    ];
    
    // Filter based on type
    if (type === 'credit') {
      return allCategories.filter(c => !BUSINESS_RULES.DEBIT_ONLY_CATEGORIES.includes(c));
    } else {
      return allCategories.filter(c => !BUSINESS_RULES.CREDIT_ONLY_CATEGORIES.includes(c));
    }
  });

  readonly isScheduled = computed(() => {
    const date = this.form.get('date')?.value;
    return date && date > this.today;
  });

  ngOnInit(): void {
    // Check for draft resume
    const resume = this.route.snapshot.queryParams['resume'];
    if (resume === 'true') {
      this.loadDraft();
    }

    // Listen for type changes to reset category if invalid
    this.form.get('type')?.valueChanges.subscribe(() => {
      const currentCategory = this.form.get('category')?.value;
      if (currentCategory && !this.availableCategories().includes(currentCategory)) {
        this.form.get('category')?.setValue('');
      }
    });
  }

  ngOnDestroy(): void {
    // Auto-save draft if form has values
    if (this.form.dirty && !this.isSubmitting()) {
      this.autoSaveDraft();
    }
  }

  setType(type: TransactionType): void {
    const account = this.customerState.selectedAccount();
    if (type === 'debit' && account?.status === 'frozen') {
      return;
    }
    this.form.get('type')?.setValue(type);
  }

  loadDraft(): void {
    const draft = this.transactionService.getDraft();
    if (draft) {
      this.form.patchValue({
        type: draft.type || 'credit',
        amount: draft.amount || null,
        category: draft.category || '',
        date: draft.date || this.today,
        description: draft.description || ''
      });
      this.toast.info('Draft loaded');
    }
  }

  saveDraft(): void {
    const draft: DraftTransaction = {
      accountId: this.customerState.selectedAccountId() || undefined,
      type: this.form.get('type')?.value,
      amount: this.form.get('amount')?.value,
      category: this.form.get('category')?.value,
      date: this.form.get('date')?.value,
      description: this.form.get('description')?.value,
      savedAt: new Date().toISOString()
    };
    this.transactionService.saveDraft(draft);
    this.toast.success('Draft saved');
  }

  private autoSaveDraft(): void {
    const values = this.form.value;
    if (values.amount || values.description) {
      this.saveDraft();
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.validationErrors.set([]);

    const { type, amount, category, date, description } = this.form.value;
    
    const result = this.transactionService.createTransaction(
      type,
      category,
      amount,
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
      this.validationErrors.set(result.errors || []);
      this.isSubmitting.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/transactions']);
  }

  getFieldError(field: string): string {
    const control = this.form.get(field);
    return getErrorMessage(control?.errors || null);
  }
}
