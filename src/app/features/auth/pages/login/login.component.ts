import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { AuthService } from '@core/index';
import { ButtonComponent } from '@shared/index';

interface LoginData {
  username: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, ButtonComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly loginModel = signal<LoginData>({
    username: '',
    password: ''
  });

  readonly loginForm = form(this.loginModel, (schemaPath) => {
    required(schemaPath.username, { message: 'Username is required' });
    required(schemaPath.password, { message: 'Password is required' });
  });

  togglePassword(): void {
    this.showPassword.update(show => !show);
  }

  fillCredentials(username: string, password: string): void {
    this.loginForm.username().value.set(username);
    this.loginForm.password().value.set(password);
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.loginForm().invalid()) {
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { username, password } = this.loginModel();
    const result = this.authService.login(username, password);

    if (result.success) {
      this.router.navigate(['/customers']);
    } else {
      this.errorMessage.set(result.error ?? 'Login failed');
    }

    this.isLoading.set(false);
  }
}
