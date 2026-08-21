import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { TotemService } from '../../core/services/totem.service';
import { ToastService } from '../../core/services/toast.service';

const ENDPOINT_URL = 'https://script.google.com/macros/s/AKfycbx1ogZG9xV_0ziO7LT7lKG71PrYrLHTD5El4pWForgY56Goq6ilo11H9iAVBYSeBAs6/exec';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule, BreadcrumbComponent, ButtonComponent],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
})
export class ContactComponent {
  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Contato', href: '/contato' },
  ];

  name = '';
  email = '';
  specialty = '';
  message = '';
  /** Honeypot — a field real users never see or fill. Any value here means a bot filled the form. */
  website = '';

  submitted = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  constructor(public totem: TotemService, private toast: ToastService) {}

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.submitted()) return;

    if (this.website.trim()) {
      this.submitted.set(true);
      return;
    }

    if (!this.name.trim() || !this.email.includes('@') || !this.message.trim()) {
      this.error.set('Preencha nome, e-mail e mensagem para continuar.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    const body = new URLSearchParams();
    body.set('name', this.name);
    body.set('email', this.email);
    body.set('specialty', this.specialty);
    body.set('message', this.message);

    try {
      // Apps Script exec URLs don't send Access-Control-Allow-Origin, so a
      // normal cross-origin fetch is blocked before we can read the
      // response. `no-cors` still delivers the POST — we just can't read
      // the response body back, so success here means the request went
      // out, not that the server confirmed it.
      await fetch(ENDPOINT_URL, { method: 'POST', mode: 'no-cors', body });

      if (this.totem.isTotem()) {
        this.toast.show('Mensagem enviada — obrigado pelo contato!');
        this.name = '';
        this.email = '';
        this.specialty = '';
        this.message = '';
      } else {
        this.submitted.set(true);
      }
    } catch {
      this.error.set('Não foi possível enviar sua mensagem agora. Tente novamente em instantes.');
    } finally {
      this.submitting.set(false);
    }
  }
}
