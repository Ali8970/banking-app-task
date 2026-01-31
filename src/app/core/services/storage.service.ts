import { Injectable, inject } from '@angular/core';
import { LoggerService } from './logger.service';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly logger = inject(LoggerService);
  private readonly prefix = 'banking_app_';
  private memoryStore = new Map<string, string>();

  setSession<T>(key: string, value: T): void {
    try {
      const prefixedKey = this.prefix + key;
      const serialized = JSON.stringify(value);
      sessionStorage.setItem(prefixedKey, serialized);
    } catch (error) {
      this.logger.error('Failed to store in sessionStorage', { key, error }, 'StorageService');
    }
  }

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

  clearAll(): void {
    this.memoryStore.clear();
    this.clearStorageByPrefix(sessionStorage);
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
