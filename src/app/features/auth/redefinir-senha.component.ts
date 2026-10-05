import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-redefinir-senha',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './redefinir-senha.component.html',
  styleUrl: './create-account.component.scss',
})
export class RedefinirSenhaComponent implements OnInit {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Redefinir senha', href: '/redefinir-senha' },
  ];

  private usuarioId = '';
  private token = '';
  linkValido = true;

  novaSenha = '';
  confirmarSenha = '';
  submitting = signal(false);
  sucesso = signal(false);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.usuarioId = params.get('userId') ?? '';
      this.token = params.get('token') ?? '';
      this.linkValido = !!this.usuarioId && !!this.token;
    });
  }

  onSubmit(): void {
    if (this.novaSenha.length < 8) {
      this.error.set('A senha precisa ter pelo menos 8 caracteres.');
      return;
    }
    if (this.novaSenha !== this.confirmarSenha) {
      this.error.set('As senhas não coincidem.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    this.authService.redefinirSenha(this.usuarioId, this.token, this.novaSenha).subscribe({
      next: () => {
        this.submitting.set(false);
        this.sucesso.set(true);
        setTimeout(() => this.router.navigate(['/entrar']), 2500);
      },
      error: (err) => {
        this.submitting.set(false);
        this.error.set(typeof err?.error === 'string' ? err.error : 'Não foi possível redefinir a senha. O link pode ter expirado — peça um novo.');
      },
    });
  }
}
