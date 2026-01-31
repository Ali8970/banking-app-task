import { ValidationErrors } from '@angular/forms';

/**
 * Error Map - Maps validation error codes to user-friendly messages
 * Central place for all form validation error messages
 */

export interface ErrorMessage {
  code: string;
  message: string;
}

/**
 * Default error messages for common validation errors
 */
const DEFAULT_ERROR_MESSAGES: Record<string, string> = {
  required: 'This field is required',
  email: 'Please enter a valid email address',
  minlength: 'This value is too short',
  maxlength: 'This value is too long',
  min: 'This value is too small',
  max: 'This value is too large',
  pattern: 'Please enter a valid value',
  
  // Custom transaction errors
  invalidAmount: 'Please enter a valid amount',
  negativeAmount: 'Amount must be greater than zero',
  exceedsLimit: 'Amount exceeds the allowed limit',
  dailyLimitExceeded: 'Daily debit limit exceeded',
  maxTransactionsExceeded: 'Maximum daily transactions exceeded',
  invalidCategoryForType: 'This category is not allowed for this transaction type',
  dateBeforeOpening: 'Date cannot be before account opening date',
  noAccount: 'Please select an account',
  accountInactive: 'Account is inactive',
  accountFrozen: 'Account is frozen for debit transactions'
};

/**
 * Get user-friendly error message from validation errors
 */
export function getErrorMessage(errors: ValidationErrors | null): string {
  if (!errors) {
    return '';
  }

  // Get the first error key
  const errorKey = Object.keys(errors)[0];
  const errorValue = errors[errorKey];

  // If error value has a message property, use it
  if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
    return errorValue.message;
  }

  // Handle minlength/maxlength with actual values
  if (errorKey === 'minlength' && errorValue) {
    return `Minimum ${errorValue.requiredLength} characters required`;
  }
  if (errorKey === 'maxlength' && errorValue) {
    return `Maximum ${errorValue.requiredLength} characters allowed`;
  }
  if (errorKey === 'min' && errorValue) {
    return `Minimum value is ${errorValue.min}`;
  }
  if (errorKey === 'max' && errorValue) {
    return `Maximum value is ${errorValue.max}`;
  }

  // Use default message or generic fallback
  return DEFAULT_ERROR_MESSAGES[errorKey] || 'Invalid value';
}

/**
 * Get all error messages from validation errors
 */
export function getAllErrorMessages(errors: ValidationErrors | null): ErrorMessage[] {
  if (!errors) {
    return [];
  }

  return Object.keys(errors).map(code => ({
    code,
    message: getErrorMessageForCode(code, errors[code])
  }));
}

/**
 * Get error message for a specific error code
 */
function getErrorMessageForCode(code: string, errorValue: unknown): string {
  // If error value has a message property, use it
  if (errorValue && typeof errorValue === 'object' && 'message' in errorValue) {
    return (errorValue as { message: string }).message;
  }

  // Handle special cases
  if (code === 'minlength' && errorValue && typeof errorValue === 'object') {
    const val = errorValue as { requiredLength: number };
    return `Minimum ${val.requiredLength} characters required`;
  }
  if (code === 'maxlength' && errorValue && typeof errorValue === 'object') {
    const val = errorValue as { requiredLength: number };
    return `Maximum ${val.requiredLength} characters allowed`;
  }

  return DEFAULT_ERROR_MESSAGES[code] || 'Invalid value';
}
