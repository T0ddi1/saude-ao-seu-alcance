import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-create-account',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './create-account.component.html',
  styleUrl: './create-account.component.scss',
})
export class CreateAccountComponent {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Entrar', href: '/entrar' },
  ];

  email = '';
  password = '';
  showPassword = false;
  rememberMe = false;
  submitting = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService, private router: Router) {}

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

    this.authService.login({ email: this.email, senha: this.password }).subscribe({
      next: (resposta) => {
        this.submitting.set(false);
        const ehStaff = resposta.papeis?.includes('Admin') || resposta.papeis?.includes('Editor');
        this.router.navigate([ehStaff ? '/admin' : '/perfil']);
      },
      error: () => {
        this.submitting.set(false);
        this.error.set('Email ou senha inválidos.');
      },
    });
  }
}
