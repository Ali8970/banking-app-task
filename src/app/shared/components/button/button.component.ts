import { Component, input, output } from '@angular/core';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Button Component - Reusable button with variants
 * Follows WCAG AA accessibility standards
 */
@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrl: './button.component.css'
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  size = input<ButtonSize>('md');
  type = input<'button' | 'submit' | 'reset'>('button');
  disabled = input<boolean>(false);
  loading = input<boolean>(false);
  loadingText = input<string>('Loading...');
  fullWidth = input<boolean>(false);

  clicked = output<MouseEvent>();

  handleClick(event: MouseEvent): void {
    if (!this.disabled() && !this.loading()) {
      this.clicked.emit(event);
    }
  }

  buttonClasses(): string {
    const variants: Record<ButtonVariant, string> = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      danger: 'btn-danger',
      ghost: 'btn-ghost',
      outline: 'btn-outline'
    };

    const sizes: Record<ButtonSize, string> = {
      sm: 'btn-sm',
      md: 'btn-md',
      lg: 'btn-lg'
    };

    const width = this.fullWidth() ? 'btn-full' : '';

    return `btn ${variants[this.variant()]} ${sizes[this.size()]} ${width}`.trim();
  }
}
