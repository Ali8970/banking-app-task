import { Injectable, inject, signal, computed } from '@angular/core';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import { DataLoaderService } from './data-loader.service';
import { Customer, Account } from '../models';

const SELECTED_CUSTOMER_KEY = 'selected_customer_id';

@Injectable({
  providedIn: 'root'
})
export class CustomerStateService {
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly dataLoader = inject(DataLoaderService);

  private readonly _selectedCustomerId = signal<string | null>(null);
  private readonly _selectedAccountId = signal<string | null>(null);

  readonly selectedCustomer = computed(() => {
    const id = this._selectedCustomerId();
    if (!id) return null;
    return this.dataLoader.customers().find(c => c.id === id) || null;
  });

  // Computed: Accounts for selected customer
  readonly customerAccounts = computed(() => {
    const customerId = this._selectedCustomerId();
    if (!customerId) return [];
    return this.dataLoader.accounts().filter(a => a.customerId === customerId);
  });

  readonly selectedAccount = computed(() => {
    const id = this._selectedAccountId();
    if (!id) return null;
    return this.customerAccounts().find(a => a.id === id) || null;
  });

  // Public signals
  readonly selectedCustomerId = this._selectedCustomerId.asReadonly();
  readonly selectedAccountId = this._selectedAccountId.asReadonly();
  readonly hasSelectedCustomer = computed(() => !!this._selectedCustomerId());
  readonly hasSelectedAccount = computed(() => !!this._selectedAccountId());

  constructor() {
    this.restoreState();
  }

  private restoreState(): void {
    const storedId = this.storage.getSession<string>(SELECTED_CUSTOMER_KEY);
    if (storedId) {
      this._selectedCustomerId.set(storedId);
      this.logger.debug('Restored selected customer', { customerId: storedId }, 'CustomerStateService');
    }
  }

  selectCustomer(customerId: string | null): void {
    const previousId = this._selectedCustomerId();
    
    if (previousId !== customerId) {
      // Update customer selection
      this._selectedCustomerId.set(customerId);
      
      // Reset account selection when customer changes
      this._selectedAccountId.set(null);
      
      // Persist to session storage
      if (customerId) {
        this.storage.setSession(SELECTED_CUSTOMER_KEY, customerId);
      } else {
        this.storage.removeSession(SELECTED_CUSTOMER_KEY);
      }
      
      this.logger.info('Customer selected', { customerId, previousId }, 'CustomerStateService');
    }
  }

  /**
   * Select an account
   */
  selectAccount(accountId: string | null): void {
    const account = accountId 
      ? this.customerAccounts().find(a => a.id === accountId)
      : null;
    
    if (account || accountId === null) {
      this._selectedAccountId.set(accountId);
      this.logger.debug('Account selected', { accountId }, 'CustomerStateService');
    }
  }

  clearSelection(): void {
    this._selectedCustomerId.set(null);
    this._selectedAccountId.set(null);
    this.storage.removeSession(SELECTED_CUSTOMER_KEY);
    this.logger.info('Selection cleared', undefined, 'CustomerStateService');
  }

  /**
   * Get all customers
   */
  getAllCustomers(): Customer[] {
    return this.dataLoader.customers();
  }

  getAccountById(accountId: string): Account | undefined {
    return this.dataLoader.accounts().find(a => a.id === accountId);
  }
}
