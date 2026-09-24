import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';
import { LoginResponse } from '../../core/models/admin.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-registrar',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './registrar.component.html',
  styleUrl: './registrar.component.scss',
})
export class RegistrarComponent {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);

  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Criar conta', href: '/criar-conta' },
  ];

  erro = signal<string | null>(null);
  enviando = signal(false);

  formulario = this.fb.group({
    nomeCompleto: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]],
  });

  onSubmit(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.erro.set(null);

    this.http
      .post<LoginResponse>(`${environment.apiBaseUrl}/auth/registrar`, this.formulario.getRawValue())
      .subscribe({
        next: () => {
          this.enviando.set(false);
          const email = this.formulario.value.email!;
          const senha = this.formulario.value.senha!;
          this.authService.login({ email, senha }).subscribe(() => this.router.navigate(['/perfil']));
        },
        error: (erro) => {
          this.enviando.set(false);
          this.erro.set(erro?.error ?? 'Não foi possível criar a conta.');
        },
      });
  }
}
