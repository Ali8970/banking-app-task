import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LoggerService } from './logger.service';
import { Customer, Account, Transaction } from '../models';

/**
 * Data Loader Service - Loads static JSON data once and caches in memory
 * 
 * Cache Strategy:
 * - Data loaded once on first request
 * - Cached in memory using signals
 * - No automatic cache invalidation (static data)
 * - Manual invalidation via reload methods if needed
 */
@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {
  private readonly http = inject(HttpClient);
  private readonly logger = inject(LoggerService);

  // Cached data signals
  private readonly _customers = signal<Customer[]>([]);
  private readonly _accounts = signal<Account[]>([]);
  private readonly _transactions = signal<Transaction[]>([]);
  
  // Loading state
  private readonly _isLoading = signal(false);
  private readonly _isLoaded = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public read-only signals
  readonly customers = this._customers.asReadonly();
  readonly accounts = this._accounts.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isLoaded = this._isLoaded.asReadonly();
  readonly error = this._error.asReadonly();

  /**
   * Load all data if not already loaded
   */
  async loadAllData(): Promise<void> {
    if (this._isLoaded()) {
      this.logger.debug('Data already loaded, skipping', undefined, 'DataLoaderService');
      return;
    }

    if (this._isLoading()) {
      this.logger.debug('Data loading in progress, skipping', undefined, 'DataLoaderService');
      return;
    }

    this._isLoading.set(true);
    this._error.set(null);

    try {
      this.logger.info('Loading static data...', undefined, 'DataLoaderService');
      
      // Load all data in parallel
      const [customers, accounts, transactions] = await Promise.all([
        this.loadCustomers(),
        this.loadAccounts(),
        this.loadTransactions()
      ]);

      this._customers.set(customers);
      this._accounts.set(accounts);
      this._transactions.set(transactions);
      this._isLoaded.set(true);

      this.logger.info('Static data loaded successfully', {
        customers: customers.length,
        accounts: accounts.length,
        transactions: transactions.length
      }, 'DataLoaderService');
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load data';
      this._error.set(message);
      this.logger.error('Failed to load static data', { error }, 'DataLoaderService');
      throw error;
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Force reload all data
   */
  async reloadAllData(): Promise<void> {
    this._isLoaded.set(false);
    await this.loadAllData();
  }

  /**
   * Add a transaction to the cache (for newly created transactions)
   */
  addTransaction(transaction: Transaction): void {
    this._transactions.update(txns => [...txns, transaction]);
    this.logger.debug('Transaction added to cache', { id: transaction.id }, 'DataLoaderService');
  }

  /**
   * Update a transaction in the cache
   */
  updateTransaction(id: string, updates: Partial<Transaction>): void {
    this._transactions.update(txns => 
      txns.map(t => t.id === id ? { ...t, ...updates } : t)
    );
    this.logger.debug('Transaction updated in cache', { id }, 'DataLoaderService');
  }

  /**
   * Remove a transaction from the cache
   */
  removeTransaction(id: string): void {
    this._transactions.update(txns => txns.filter(t => t.id !== id));
    this.logger.debug('Transaction removed from cache', { id }, 'DataLoaderService');
  }

  private async loadCustomers(): Promise<Customer[]> {
    return firstValueFrom(this.http.get<Customer[]>('assets/data/customers.json'));
  }

  private async loadAccounts(): Promise<Account[]> {
    return firstValueFrom(this.http.get<Account[]>('assets/data/accounts.json'));
  }

  private async loadTransactions(): Promise<Transaction[]> {
    return firstValueFrom(this.http.get<Transaction[]>('assets/data/transactions.json'));
  }
}
