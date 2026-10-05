import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-descadastrar',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './descadastrar.component.html',
  styleUrl: './create-account.component.scss',
})
export class DescadastrarComponent implements OnInit {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Descadastro', href: '/descadastrar' },
  ];

  private usuarioId = '';
  private token = '';
  linkValido = true;

  processando = signal(false);
  concluido = signal(false);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.usuarioId = params.get('userId') ?? '';
      this.token = params.get('token') ?? '';
      this.linkValido = !!this.usuarioId && !!this.token;
    });
  }

  confirmar(): void {
    this.error.set(null);
    this.processando.set(true);

    this.authService.descadastrar(this.usuarioId, this.token).subscribe({
      next: () => {
        this.processando.set(false);
        this.concluido.set(true);
      },
      error: () => {
        this.processando.set(false);
        this.error.set('Não foi possível concluir o descadastro. O link pode ter expirado.');
      },
    });
  }
}
