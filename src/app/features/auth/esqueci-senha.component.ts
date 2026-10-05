import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-esqueci-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './esqueci-senha.component.html',
  styleUrl: './create-account.component.scss',
})
export class EsqueciSenhaComponent {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Esqueci minha senha', href: '/esqueci-senha' },
  ];

  email = '';
  submitting = signal(false);
  enviado = signal(false);
  error = signal<string | null>(null);

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email.trim()) {
      this.error.set('Digite o seu e-mail.');
      return;
    }
    this.error.set(null);
    this.submitting.set(true);

    this.authService.esqueciSenha(this.email.trim()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.enviado.set(true);
      },
      error: () => {
        this.submitting.set(false);
        this.enviado.set(true);
      },
    });
  }
}
