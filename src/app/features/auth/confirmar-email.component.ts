import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-confirmar-email',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent],
  templateUrl: './confirmar-email.component.html',
  styleUrl: './create-account.component.scss',
})
export class ConfirmarEmailComponent implements OnInit {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Confirmar e-mail', href: '/confirmar-email' },
  ];

  confirmando = signal(true);
  sucesso = signal(false);

  constructor(private route: ActivatedRoute, private authService: AuthService) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      const usuarioId = params.get('userId') ?? '';
      const token = params.get('token') ?? '';

      if (!usuarioId || !token) {
        this.confirmando.set(false);
        return;
      }

      this.authService.confirmarEmail(usuarioId, token).subscribe({
        next: () => {
          this.confirmando.set(false);
          this.sucesso.set(true);
        },
        error: () => this.confirmando.set(false),
      });
    });
  }
}
