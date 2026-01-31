import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '@core/index';
import { ButtonComponent } from '@shared/index';

/**
 * Login Component - Authentication page
 * 
 * Demo credentials:
 * - admin / admin123 (Full access)
 * - teller / teller123 (Can create transactions)
 * - viewer / viewer123 (View only)
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loginForm: FormGroup = this.fb.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]]
  });

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  fillCredentials(username: string, password: string): void {
    this.loginForm.patchValue({ username, password });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.loginForm.value;
    const result = this.authService.login(username, password);

    if (result.success) {
      this.router.navigate(['/customers']);
    } else {
      this.errorMessage.set(result.error || 'Login failed');
    }

    this.isLoading.set(false);
  }
}
