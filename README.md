# Digital Banking Front-End

Angular 21 front-end for a customer-centric banking view used by tellers and relationship managers.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Architecture Decisions](#architecture-decisions)
- [State Management](#state-management)
- [Layer Implementation](#layer-implementation)
- [Business Rules](#business-rules)
- [Design Patterns](#design-patterns)
- [Performance](#performance-optimizations)
- [Accessibility](#accessibility)
- [Demo Credentials](#demo-credentials)

## Overview

- Customer context selection and management
- Account list with statuses: active, frozen, inactive
- Transaction creation and validation with configurable rules
- Analytics: spending trends, averages, abnormal spending
- Multi-currency accounts (EGP, USD, EUR, GBP, SAR)

## Getting Started

### Prerequisites

- Node.js 20.x or 22.x
- npm 9.x or later
- Angular CLI 21.x

### Installation

```bash
# Install dependencies
npm install

# Start development server
ng serve

# Navigate to http://localhost:4200
```

### Build

```bash
# Production build
ng build

# Output in dist/banking-app
```

## Architecture Decisions

### Project Structure

```
src/app/
├── core/                    # Core module (singleton services, guards, models)
│   ├── guards/              # Route guards (auth, role-based)
│   ├── handlers/            # Global error handler
│   ├── interceptors/        # HTTP interceptors
│   ├── models/              # TypeScript interfaces and types
│   └── services/            # Core services (auth, storage, data loader)
├── features/                # Feature modules (lazy-loaded)
│   ├── auth/                # Authentication feature
│   ├── customers/           # Customer management
│   ├── accounts/            # Account management
│   ├── transactions/        # Transaction engine
│   └── analytics/           # Financial analytics
├── shared/                  # Shared utilities and components
│   ├── components/          # Reusable UI components
│   ├── pipes/               # Custom pipes
│   ├── validators/          # Form validators
│   └── utils/               # Utility functions
└── assets/
    └── data/                # Static JSON data files
```

### Why This Structure?

1. **Feature-Based Architecture**: Each feature is self-contained with its own components, services, and routes, enabling lazy loading and clear boundaries.

2. **Core Module**: Contains singleton services and utilities that are instantiated once and shared across the application.

3. **Shared Module**: Houses reusable components, pipes, and validators that can be imported by any feature module.

4. **SOLID Principles**:
   - **S**ingle Responsibility: Each service handles one domain (Auth, Transactions, Analytics)
   - **O**pen/Closed: Validators can be extended without modifying core transaction logic
   - **L**iskov Substitution: Services implement consistent interfaces
   - **I**nterface Segregation: Models are specific to their domain
   - **D**ependency Inversion: Components depend on service abstractions, not implementations

## State Management

### Choice: Signals-Based Store

We chose **Signals** over RxJS Store for the following reasons:

1. **Simplicity**: Signals provide a straightforward reactive primitive without the complexity of RxJS operators for state management.

2. **Performance**: Signals enable fine-grained reactivity, updating only what has changed without manual subscription management.

3. **Angular 21 Alignment**: Signals are the recommended approach for new Angular applications, especially with zoneless change detection.

4. **Type Safety**: Signals provide excellent TypeScript inference and type safety out of the box.

### Implementation

```typescript
// Example: CustomerStateService
private readonly _selectedCustomerId = signal<string | null>(null);
readonly selectedCustomer = computed(() => {
  const id = this._selectedCustomerId();
  return this.dataLoader.customers().find(c => c.id === id) || null;
});
```

### Cache Strategy

- **Data Loading**: JSON files loaded once via `DataLoaderService` on application init
- **In-Memory Cache**: All data cached in signals, shared across features
- **Cache Invalidation**: Manual invalidation on explicit actions (add/remove/update transaction)
- **No TTL**: Static data doesn't require time-based invalidation

## Layer Implementation

### Layer 0: Application Foundation
- Standalone components (no NgModules)
- Lazy-loaded routes for all features
- Path aliases (@core, @features, @shared)
- Zoneless change detection (experimental) with signals

### Layer 1: Authentication & Security
- **Fake JWT**: Client-side token generation with base64 encoding
- **Token storage**: sessionStorage only (cleared on tab close); no plain localStorage for tokens. In-memory fallback when storage is unavailable.
- **Auth Guard**: Protects all routes except /auth/*
- **Auto Logout**: 15-minute inactivity timer with event listeners
- **Roles**: Admin, Teller, Viewer. Create Transaction is hidden for Viewer; /transactions/create is guarded so Viewer cannot open it by URL.

### Layer 2: Customers & Accounts
- **Customer Persistence**: Selected customer ID stored in sessionStorage
- **State Reset**: Switching customer clears account and transaction selections
- **Account Status Rules**:
  - Active: All operations allowed
  - Frozen: Credits only, debits disabled
  - Inactive: All transactions disabled

### Layer 3: Transaction Engine
- **Service-Layer Logic**: All validation and processing in TransactionService
- **Derived Balance**: Calculated from transaction list, not stored
- **Business Rules**:
  - Daily debit limit: 20,000 EGP
  - Max transactions per day: 10
  - Category restrictions (Income → Credit, Fees → Debit)
  - Date validation (cannot be before account opening)

### Layer 4: Data & Performance
- **One-Time Load**: JSON data loaded once at app init and shared across features
- **Cache invalidation**: Data is static; cache updates only on explicit user actions (add transaction, undo, process scheduled). No TTL.
- **Virtual Scrolling**: CDK virtual scroll for transaction list
- **Computed Signals**: Memoized derived state; zoneless change detection

### Layer 5: Analytics
- **Spending Trend**: Last 3 months aggregated by month
- **Average Transaction**: Computed from all customer transactions
- **Abnormal Detection**: Rule-based (>150% of average)
- **No Charts**: Raw computed data displayed in cards and lists

### Layer 6: Error Handling & UX
- **Global Handler**: Centralized error processing with logging
- **User Messages**: Error codes mapped to friendly messages
- **Skeleton Loaders**: For all loading states
- **Empty States**: Custom messages for each feature
- **Disabled States**: Business rule-driven (frozen accounts, viewer role, limits)

### Layer 7: Extended Features (spec required one; all four implemented)

#### 1. Undo Last Transaction
- **Implementation**: Command-style with last transaction stored in signal
- **Scope**: Only the most recent completed transaction can be undone
- **UI**: Banner with undo button, toast with undo action
- **Persistence**: Undo state is session-only

#### 2. Multi-Currency Support
- **Model**: Each account has a currency (EGP, USD, EUR, GBP, SAR)
- **Display**: Currency symbols and codes shown with amounts
- **Validation**: Transactions inherit account currency
- **Exchange Rates**: Static rates for display purposes only

#### 3. Scheduled Transactions
- **Model**: Transaction status: 'completed' | 'scheduled'
- **Logic**: Future-dated transactions are marked as 'scheduled'
- **Processing**: Manual "Process Now" or automatic on date match
- **UI**: Separate tab for scheduled transactions

#### 4. Draft Transactions
- **Model**: Form state saved to localStorage
- **Auto-Save**: On component destroy if form is dirty
- **Resume**: "Resume Draft" button when draft exists
- **Clear**: Draft cleared on successful submission

## Business Rules

| Rule | Type | Value |
|------|------|-------|
| Daily Debit Limit | Amount | 20,000 EGP |
| Max Daily Transactions | Count | 10 |
| Inactivity Timeout | Time | 15 minutes |
| Abnormal Spending Threshold | Percentage | 150% of average |
| Credit-Only Categories | Category | income, refund, deposit |
| Debit-Only Categories | Category | fees, withdrawal, payment |

## Design Patterns

### Strategy Pattern
Used for transaction validators. Each validation rule is a pure function that can be composed and extended.

```typescript
export function amountValidator(maxAmount?: number): ValidatorFn
export function categoryTypeValidator(transactionType: TransactionType): ValidatorFn
```

### Facade Pattern
Services act as facades over core functionality, exposing only necessary computed signals.

```typescript
// TransactionService exposes computed signals
readonly accountBalance = computed(() => ...);
readonly todayDebitTotal = computed(() => ...);
```

### Command Pattern
Undo functionality implemented as reversible commands stored in a stack.

```typescript
createTransaction() → stores last transaction → enables undo
undoLastTransaction() → removes last transaction → disables undo
```

## Performance Optimizations

1. **Lazy Loading**: All feature routes are lazy-loaded
2. **Virtual Scrolling**: Transaction list uses CDK virtual scroll (itemSize: 88px)
3. **Zoneless + Signals**: Change detection uses zoneless mode; derived state via computed signals
4. **Computed Signals**: Derived state is memoized and only recalculates when dependencies change
5. **Track By**: All @for loops use track expressions for efficient DOM updates
6. **One-Time Data Load**: Static data loaded once and cached in memory

## Accessibility

- **Semantic HTML**: Proper heading hierarchy, landmarks, lists
- **ARIA Labels**: All interactive elements have accessible names
- **Focus Management**: Visible focus indicators, logical tab order
- **Color Contrast**: WCAG AA compliant (4.5:1 for text)
- **Keyboard Navigation**: All functionality accessible via keyboard
- **Screen Reader Support**: Status updates announced via aria-live regions

## Demo Credentials

| Username | Password | Role | Permissions |
|----------|----------|------|-------------|
| admin | admin123 | Admin | Full access |
| teller | teller123 | Teller | Create transactions |
| viewer | viewer123 | Viewer | View only (no create) |

## Technologies

- **Framework**: Angular 21 (Standalone Components)
- **Styling**: Tailwind CSS v4
- **State**: Signals-based reactive state
- **Forms**: Signal-based forms (@angular/forms/signals)
- **Virtual Scroll**: Angular CDK
- **Change Detection**: Zoneless (experimental)
