import { Component, Input, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

/** localStorage key marking that this browser already subscribed — blocks resubmission client-side. */
const STORAGE_KEY = 'saude-newsletter-subscribed';

/**
 * Google Apps Script web app (doPost) that appends [timestamp, email] to the
 * "Inscricoes" sheet. Deployed with access "Anyone" so it can be called
 * straight from the browser — no credentials involved, only the public
 * exec URL. See the sheet's Apps Script project to change behavior.
 */
const ENDPOINT_URL =
  'https://script.google.com/macros/s/AKfycbx6rQn1JKXu26XZdSAe6owV-podwvqM3t7cL0lrHEs1PQ-VX-ISKRAO0AJVwa5WJYyt3g/exec';

@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './newsletter-form.component.html',
  styleUrl: './newsletter-form.component.scss',
})
export class NewsletterFormComponent implements OnInit {
  @Input() placeholder = 'Seu e-mail';
  @Input() ctaLabel = 'Inscrever';

  email = '';
  /** Honeypot — a field real users never see or fill. Any value here means a bot filled the form. */
  website = '';
  submitted = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    if (localStorage.getItem(STORAGE_KEY)) {
      this.submitted.set(true);
    }
  }

  async onSubmit(): Promise<void> {
    if (this.submitting() || this.submitted()) return;

    if (this.website.trim()) {
      // Bot caught by the honeypot — pretend success without actually
      // sending anything, so it doesn't learn to leave the field empty.
      this.submitted.set(true);
      return;
    }

    if (!this.email.includes('@')) {
      this.error.set('Digite um e-mail válido.');
      return;
    }

    this.error.set(null);
    this.submitting.set(true);

    const body = new URLSearchParams();
    body.set('email', this.email);

    try {
      // Apps Script exec URLs don't send Access-Control-Allow-Origin, so a
      // normal cross-origin fetch is blocked before we can read the
      // response. `no-cors` still delivers the POST (the row lands in the
      // sheet) — we just can't read the JSON body back, so success here
      // only means the request went out, not that the server confirmed it.
      await fetch(ENDPOINT_URL, { method: 'POST', mode: 'no-cors', body });

      localStorage.setItem(STORAGE_KEY, this.email);
      this.submitted.set(true);
    } catch {
      this.error.set('Não foi possível concluir a inscrição agora. Tente novamente em instantes.');
    } finally {
      this.submitting.set(false);
    }
  }
}
