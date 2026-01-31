import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { LoggerService } from './logger.service';
import { User, UserRole, AuthToken, BUSINESS_RULES } from '../models';

// Demo users for authentication
const DEMO_USERS: Record<string, { password: string; user: Omit<User, 'id'> }> = {
  admin: {
    password: 'admin123',
    user: { username: 'admin', role: 'admin', name: 'Admin User' }
  },
  teller: {
    password: 'teller123',
    user: { username: 'teller', role: 'teller', name: 'Bank Teller' }
  },
  viewer: {
    password: 'viewer123',
    user: { username: 'viewer', role: 'viewer', name: 'View Only User' }
  }
};

/**
 * Auth Service - Handles authentication, authorization, and session management
 * 
 * Features:
 * - Fake JWT token generation (client-side simulation)
 * - Secure token storage (memory + session)
 * - Auto logout on inactivity
 * - Role-based access control
 */
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly storage = inject(StorageService);
  private readonly logger = inject(LoggerService);
  private readonly router = inject(Router);

  // State signals
  private readonly _currentUser = signal<User | null>(null);
  private readonly _isAuthenticated = signal(false);
  private readonly _isLoading = signal(false);

  // Inactivity timer
  private inactivityTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];

  // Public computed signals
  readonly currentUser = this._currentUser.asReadonly();
  readonly isAuthenticated = this._isAuthenticated.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  
  readonly userRole = computed(() => this._currentUser()?.role ?? null);
  readonly userName = computed(() => this._currentUser()?.name ?? '');
  
  readonly isAdmin = computed(() => this._currentUser()?.role === 'admin');
  readonly isTeller = computed(() => this._currentUser()?.role === 'teller');
  readonly isViewer = computed(() => this._currentUser()?.role === 'viewer');
  
  // Permission computed signals
  readonly canCreateTransaction = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'admin' || role === 'teller';
  });
  
  readonly canManageCustomers = computed(() => {
    const role = this._currentUser()?.role;
    return role === 'admin' || role === 'teller';
  });

  constructor() {
    this.initializeAuth();
  }

  /**
   * Initialize auth state from stored token
   */
  private initializeAuth(): void {
    const token = this.storage.getSession<string>('auth_token');
    if (token) {
      const decoded = this.decodeToken(token);
      if (decoded && decoded.exp * 1000 > Date.now()) {
        this.setUserFromToken(decoded);
        this.startInactivityTimer();
        this.logger.info('Auth restored from session', { user: decoded.name }, 'AuthService');
      } else {
        this.clearAuth();
        this.logger.info('Token expired, cleared auth', undefined, 'AuthService');
      }
    }
  }

  /**
   * Login with username and password
   */
  login(username: string, password: string): { success: boolean; error?: string } {
    this._isLoading.set(true);
    
    try {
      const userEntry = DEMO_USERS[username.toLowerCase()];
      
      if (!userEntry) {
        this.logger.warn('Login failed: user not found', { username }, 'AuthService');
        return { success: false, error: 'Invalid username or password' };
      }
      
      if (userEntry.password !== password) {
        this.logger.warn('Login failed: invalid password', { username }, 'AuthService');
        return { success: false, error: 'Invalid username or password' };
      }

      // Generate fake JWT token
      const user: User = {
        id: this.generateId(),
        ...userEntry.user
      };
      
      const token = this.generateToken(user);
      
      // Store token securely
      this.storage.setSession('auth_token', token);
      this.storage.setMemory('current_user', user);
      
      // Update state
      this._currentUser.set(user);
      this._isAuthenticated.set(true);
      
      // Start inactivity monitoring
      this.startInactivityTimer();
      
      this.logger.info('Login successful', { username, role: user.role }, 'AuthService');
      return { success: true };
      
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Logout and clear all auth data
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
    this.logger.info('User logged out', undefined, 'AuthService');
  }

  /**
   * Check if user has required role
   */
  hasRole(requiredRole: UserRole | UserRole[]): boolean {
    const currentRole = this._currentUser()?.role;
    if (!currentRole) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(currentRole);
  }

  /**
   * Reset inactivity timer (called on user activity)
   */
  resetInactivityTimer(): void {
    if (this._isAuthenticated()) {
      this.startInactivityTimer();
    }
  }

  /**
   * Generate a fake JWT token (client-side simulation)
   */
  private generateToken(user: User): string {
    const header = { alg: 'HS256', typ: 'JWT' };
    const payload: AuthToken = {
      sub: user.id,
      role: user.role,
      name: user.name,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour expiry
    };
    
    // Simulate JWT structure (base64 encoded, not cryptographically signed)
    const base64Header = btoa(JSON.stringify(header));
    const base64Payload = btoa(JSON.stringify(payload));
    const signature = btoa('fake_signature_' + user.id);
    
    return `${base64Header}.${base64Payload}.${signature}`;
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): AuthToken | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      
      const payload = JSON.parse(atob(parts[1]));
      return payload as AuthToken;
    } catch {
      return null;
    }
  }

  /**
   * Set user state from decoded token
   */
  private setUserFromToken(token: AuthToken): void {
    const user: User = {
      id: token.sub,
      username: token.name.toLowerCase().replace(/\s+/g, '_'),
      role: token.role,
      name: token.name
    };
    
    this._currentUser.set(user);
    this._isAuthenticated.set(true);
    this.storage.setMemory('current_user', user);
  }

  /**
   * Start inactivity timer
   */
  private startInactivityTimer(): void {
    this.stopInactivityTimer();
    
    this.inactivityTimer = setTimeout(() => {
      this.handleInactivityTimeout();
    }, BUSINESS_RULES.INACTIVITY_TIMEOUT_MS);
    
    // Add activity listeners
    this.activityEvents.forEach(event => {
      document.addEventListener(event, this.handleUserActivity, { passive: true });
    });
  }

  /**
   * Stop inactivity timer
   */
  private stopInactivityTimer(): void {
    if (this.inactivityTimer) {
      clearTimeout(this.inactivityTimer);
      this.inactivityTimer = null;
    }
    
    // Remove activity listeners
    this.activityEvents.forEach(event => {
      document.removeEventListener(event, this.handleUserActivity);
    });
  }

  /**
   * Handle user activity (reset timer)
   */
  private handleUserActivity = (): void => {
    if (this._isAuthenticated()) {
      this.startInactivityTimer();
    }
  };

  /**
   * Handle inactivity timeout (auto logout)
   */
  private handleInactivityTimeout(): void {
    this.logger.warn('Session timeout due to inactivity', undefined, 'AuthService');
    this.logout();
  }

  /**
   * Clear all auth state
   */
  private clearAuth(): void {
    this.stopInactivityTimer();
    this._currentUser.set(null);
    this._isAuthenticated.set(false);
    this.storage.removeSession('auth_token');
    this.storage.removeMemory('current_user');
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return 'user_' + Math.random().toString(36).substring(2, 11);
  }
}
