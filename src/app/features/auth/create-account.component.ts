import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, ButtonComponent],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccountComponent {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Cadastre-se', href: '/cadastre-se' },
  ];

  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  submitting = signal(false);
  error = signal<string | null>(null);

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Preencha e-mail e senha para continuar.');
      return;
    }
    this.error.set(null);
    this.submitting.set(true);
    // TODO: replace with a real auth API call (e.g. this.authService.login(...))
    setTimeout(() => this.submitting.set(false), 800);
  }
}
