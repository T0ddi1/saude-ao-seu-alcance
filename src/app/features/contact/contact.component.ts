import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TotemService } from '../../core/services/totem.service';
import { ToastService } from '../../core/services/toast.service';
import { ContactOption, ContactOptions, ContatoService } from '../../core/services/contato.service';
import { SeoService } from '../../core/services/seo.service';
import { ESTADOS_BR } from '../../core/data/estados-br';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, ButtonComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent implements OnInit {
  private contato = inject(ContatoService);
  private toast = inject(ToastService);
  private seo = inject(SeoService);
  totem = inject(TotemService);

  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contato', href: '/contato' },
  ];

  states = ESTADOS_BR;
  options = signal<ContactOptions>({ specialties: [], sources: [], interestTypes: [] });
  cities = signal<string[]>([]);
  loadingCities = signal(false);

  fullName = '';
  email = '';
  phone = '';
  specialtyId: number | null = null;
  sourceId: number | null = null;
  interestTypeId: number | null = null;
  state = '';
  city = '';
  message = '';
  website = '';

  submitted = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Contato',
      description: 'Fale com o Saúde ao Seu Alcance: envie sua dúvida, sugestão ou solicitação e nossa equipe responde por e-mail.',
    });
    this.contato.getOptions().subscribe({
      next: (options) => this.options.set(options),
      error: () => this.error.set('Não foi possível carregar o formulário agora. Tente novamente em instantes.'),
    });
  }

  onStateChange(): void {
    this.city = '';
    this.cities.set([]);
    if (!this.state) return;

    this.loadingCities.set(true);
    this.contato.getCities(this.state).subscribe({
      next: (cities) => {
        this.cities.set(cities);
        this.loadingCities.set(false);
      },
      error: () => this.loadingCities.set(false),
    });
  }

  onPhoneInput(): void {
    const digits = this.phone.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) this.phone = digits ? `(${digits}` : '';
    else if (digits.length <= 6) this.phone = `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    else if (digits.length <= 10) this.phone = `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    else this.phone = `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  onSubmit(): void {
    if (this.submitting() || this.submitted()) return;

    if (this.website.trim()) {
      this.submitted.set(true);
      return;
    }

    const phoneDigits = this.phone.replace(/\D/g, '');
    if (!this.fullName.trim() || !/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.error.set('Preencha seu nome completo e um e-mail válido.');
      return;
    }
    if (phoneDigits.length < 10) {
      this.error.set('Informe um telefone válido com DDD.');
      return;
    }
    if (!this.specialtyId || !this.sourceId || !this.interestTypeId || !this.state || !this.city) {
      this.error.set('Preencha todos os campos obrigatórios (marcados com *).');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    this.contato
      .submit({
        fullName: this.fullName.trim(),
        email: this.email.trim(),
        phone: phoneDigits,
        specialtyId: this.specialtyId,
        sourceId: this.sourceId,
        interestTypeId: this.interestTypeId,
        state: this.state,
        city: this.city,
        message: this.message.trim() || undefined,
        ...this.contato.getUtm(),
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          if (this.totem.isTotem()) {
            this.toast.show('Cadastro enviado — obrigado pelo contato!');
            this.resetForm();
          } else {
            this.submitted.set(true);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.error.set(
            typeof err?.error === 'string' ? err.error : 'Não foi possível enviar seu cadastro agora. Tente novamente em instantes.',
          );
        },
      });
  }

  trackById(_: number, option: ContactOption): number {
    return option.id;
  }

  private resetForm(): void {
    this.fullName = this.email = this.phone = this.state = this.city = this.message = '';
    this.specialtyId = this.sourceId = this.interestTypeId = null;
    this.cities.set([]);
  }
}
