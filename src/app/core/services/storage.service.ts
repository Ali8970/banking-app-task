import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

/**
 * Storage Service - Secure storage abstraction
 * Uses sessionStorage by default for security (cleared on tab close)
 * Can be configured to use localStorage with explicit justification
 * 
 * Security considerations:
 * - sessionStorage: Data cleared when browser tab closes (more secure for sensitive data)
 * - localStorage: Data persists across sessions (use only for non-sensitive preferences)
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly logger = inject(LoggerService);
  private readonly prefix = 'banking_app_';
  
  // In-memory cache for sensitive data that shouldn't persist
  private memoryStore = new Map<string, string>();

  /**
   * Store data in sessionStorage (default - more secure)
   */
  setSession<T>(key: string, value: T): void {
    try {
      const prefixedKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      this.logger.error('Failed to store in sessionStorage', { key, error }, 'StorageService');
    }
  }

  /**
   * Retrieve data from sessionStorage
   */
  getSession<T>(key: string): T | null {
    try {
      const prefixedKey = this.prefix + key;
      const item = sessionStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      this.logger.error('Failed to retrieve from sessionStorage', { key, error }, 'StorageService');
      return null;
    }
  }

  /**
   * Remove data from sessionStorage
   */
  removeSession(key: string): void {
    const prefixedKey = this.prefix + key;
    sessionStorage.removeItem(prefixedKey);
  }

  /**
   * Store data in localStorage (use with caution - only for non-sensitive data)
   */
  setLocal<T>(key: string, value: T): void {
    try {
      const prefixedKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      localStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      this.logger.error('Failed to store in localStorage', { key, error }, 'StorageService');
    }
  }

  /**
   * Retrieve data from localStorage
   */
  getLocal<T>(key: string): T | null {
    try {
      const prefixedKey = this.prefix + key;
      const item = localStorage.getItem(prefixedKey);
      return item ? JSON.parse(item) as T : null;
    } catch (error) {
      this.logger.error('Failed to retrieve from localStorage', { key, error }, 'StorageService');
      return null;
    }
  }

  /**
   * Remove data from localStorage
   */
  removeLocal(key: string): void {
    const prefixedKey = this.prefix + key;
    localStorage.removeItem(prefixedKey);
  }

  /**
   * Store sensitive data in memory only (most secure - not persisted)
   */
  setMemory<T>(key: string, value: T): void {
    const serialized = JSON.stringify(value);
    this.memoryStore.set(key, serialized);
  }

  /**
   * Retrieve sensitive data from memory
   */
  getMemory<T>(key: string): T | null {
    const item = this.memoryStore.get(key);
    return item ? JSON.parse(item) as T : null;
  }

  /**
   * Remove data from memory store
   */
  removeMemory(key: string): void {
    this.memoryStore.delete(key);
  }

  /**
   * Clear all stored data (logout cleanup)
   */
  clearAll(): void {
    // Clear memory store
    this.memoryStore.clear();
    
    // Clear session storage with our prefix
    this.clearStorageByPrefix(sessionStorage);
    
    // Clear local storage with our prefix
    this.clearStorageByPrefix(localStorage);
    
    this.logger.info('All storage cleared', undefined, 'StorageService');
  }

  private clearStorageByPrefix(storage: Storage): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (key?.startsWith(this.prefix)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => storage.removeItem(key));
  }
}
