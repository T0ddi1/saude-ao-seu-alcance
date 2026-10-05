import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { NewsletterService } from '../../core/services/newsletter.service';

@Component({
  selector: 'app-descadastrar-newsletter',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent, ButtonComponent],
  templateUrl: './descadastrar-newsletter.component.html',
  styleUrl: './create-account.component.scss',
})
export class DescadastrarNewsletterComponent implements OnInit {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Descadastro da newsletter', href: '/newsletter/descadastrar' },
  ];

  private token = '';
  linkValido = true;

  processando = signal(false);
  concluido = signal(false);
  error = signal<string | null>(null);

  constructor(private route: ActivatedRoute, private newsletterService: NewsletterService) {}

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.token = params.get('token') ?? '';
      this.linkValido = !!this.token;
    });
  }

  confirmar(): void {
    this.error.set(null);
    this.processando.set(true);

    this.newsletterService.descadastrar(this.token).subscribe({
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
