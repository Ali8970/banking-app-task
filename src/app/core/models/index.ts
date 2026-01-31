// Core Models - Single source of truth for all data types

export type UserRole = 'admin' | 'teller' | 'viewer';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
}

export interface AuthToken {
  sub: string;
  role: UserRole;
  name: string;
  exp: number;
  iat: number;
}

export type AccountStatus = 'active' | 'inactive' | 'frozen';
export type Currency = 'EGP' | 'USD' | 'EUR' | 'GBP' | 'SAR';

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  nationalId: string;
  createdAt: string;
}

export interface Account {
  id: string;
  customerId: string;
  accountNumber: string;
  type: 'savings' | 'checking' | 'current';
  status: AccountStatus;
  currency: Currency;
  openingDate: string;
  openingBalance: number;
}

export type TransactionType = 'credit' | 'debit';
export type TransactionStatus = 'completed' | 'scheduled' | 'draft' | 'reversed';
export type TransactionCategory = 
  | 'salary' 
  | 'transfer' 
  | 'payment' 
  | 'withdrawal' 
  | 'deposit' 
  | 'income' 
  | 'fees' 
  | 'refund'
  | 'other';

export interface Transaction {
  id: string;
  accountId: string;
  type: TransactionType;
  category: TransactionCategory;
  amount: number;
  currency: Currency;
  description: string;
  date: string;
  status: TransactionStatus;
  createdAt: string;
  reference?: string;
}

export interface DraftTransaction {
  accountId?: string;
  type?: TransactionType;
  category?: TransactionCategory;
  amount?: number;
  description?: string;
  date?: string;
  savedAt: string;
}

export interface TransactionValidationError {
  code: string;
  message: string;
  field?: string;
}

export interface AnalyticsData {
  spendingTrend: MonthlySpending[];
  averageTransactionSize: number;
  totalTransactions: number;
  abnormalSpendingDetected: boolean;
  abnormalSpendingDetails?: string;
}

export interface MonthlySpending {
  month: string;
  year: number;
  total: number;
  count: number;
}

// Currency exchange rates (for display purposes only)
export const CURRENCY_RATES: Record<Currency, number> = {
  EGP: 1,
  USD: 49.5,
  EUR: 52.3,
  GBP: 62.1,
  SAR: 13.2
};

export const CURRENCY_SYMBOLS: Record<Currency, string> = {
  EGP: 'E£',
  USD: '$',
  EUR: '€',
  GBP: '£',
  SAR: 'SR'
};

// Business rule constants
export const BUSINESS_RULES = {
  DAILY_DEBIT_LIMIT: 20000,
  MAX_TRANSACTIONS_PER_DAY: 10,
  INACTIVITY_TIMEOUT_MS: 15 * 60 * 1000, // 15 minutes
  CREDIT_ONLY_CATEGORIES: ['income', 'refund', 'deposit'] as TransactionCategory[],
  DEBIT_ONLY_CATEGORIES: ['fees', 'withdrawal', 'payment'] as TransactionCategory[]
};
