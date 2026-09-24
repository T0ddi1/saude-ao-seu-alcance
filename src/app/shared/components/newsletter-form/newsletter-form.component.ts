import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { TotemService } from '../../../core/services/totem.service';
import { ToastService } from '../../../core/services/toast.service';
import { DialogFocoDirective } from '../../directives/dialog-foco.directive';
import { NewsletterService, NewsletterTopic } from '../../../core/services/newsletter.service';
import { GeolocationService } from '../../../core/services/geolocation.service';

const STORAGE_KEY = 'saude-newsletter-subscribed';

@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [DialogFocoDirective, CommonModule, FormsModule, IconComponent],
  templateUrl: './newsletter-form.component.html',
  styleUrl: './newsletter-form.component.scss',
})
export class NewsletterFormComponent implements OnInit {
  @Input() placeholder = 'Seu e-mail';
  @Input() ctaLabel = 'Inscrever';

  private totem = inject(TotemService);
  private toast = inject(ToastService);
  private newsletterService = inject(NewsletterService);
  private geolocation = inject(GeolocationService);

  email = '';
  website = '';
  submitted = signal(false);
  submitting = signal(false);
  error = signal<string | null>(null);

  modalOpen = signal(false);
  topics = signal<NewsletterTopic[]>([]);
  allTopics = true;
  selectedTopics = new Set<string>();
  accepted = false;
  modalError = signal<string | null>(null);
  nome = '';
  telefone = '';

  ngOnInit(): void {
    if (!this.totem.isTotem() && localStorage.getItem(STORAGE_KEY)) {
      this.submitted.set(true);
    }
  }

  onSubmit(): void {
    if (this.submitting() || this.submitted()) return;

    if (this.website.trim()) {
      this.submitted.set(true);
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.error.set('Digite um e-mail válido.');
      return;
    }

    this.error.set(null);
    this.openModal();
  }

  openModal(): void {
    this.allTopics = true;
    this.selectedTopics.clear();
    this.accepted = false;
    this.nome = '';
    this.telefone = '';
    this.modalError.set(null);
    this.modalOpen.set(true);

    if (!this.topics().length) {
      this.newsletterService.listTopics().subscribe({
        next: (topics) => this.topics.set(topics),
        error: () => this.modalError.set('Não foi possível carregar os assuntos agora.'),
      });
    }
  }

  closeModal(): void {
    if (this.submitting()) return;
    this.modalOpen.set(false);
  }

  toggleAllTopics(): void {
    this.allTopics = true;
    this.selectedTopics.clear();
  }

  toggleTopic(slug: string): void {
    if (this.selectedTopics.has(slug)) this.selectedTopics.delete(slug);
    else this.selectedTopics.add(slug);
    this.allTopics = this.selectedTopics.size === 0;
  }

  confirm(): void {
    if (this.submitting()) return;

    if (!/^\S+@\S+\.\S+$/.test(this.email.trim())) {
      this.modalError.set('Digite um e-mail válido.');
      return;
    }
    if (!this.accepted) {
      this.modalError.set('Para se inscrever, aceite receber nossas comunicações.');
      return;
    }

    this.modalError.set(null);
    this.submitting.set(true);

    const local = this.geolocation.getStoredLocation();

    this.newsletterService
      .subscribe({
        email: this.email.trim(),
        allTopics: this.allTopics,
        topics: [...this.selectedTopics],
        acceptedCommunications: this.accepted,
        source: this.totem.isTotem() ? 'totem' : 'footer',
        name: this.nome.trim() || undefined,
        phone: this.telefone.trim() || undefined,
        latitude: local?.latitude,
        longitude: local?.longitude,
      })
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.modalOpen.set(false);

          if (this.totem.isTotem()) {
            this.toast.show('Inscrição enviada — obrigado!');
            this.email = '';
          } else {
            localStorage.setItem(STORAGE_KEY, this.email);
            this.submitted.set(true);
          }
        },
        error: (err) => {
          this.submitting.set(false);
          this.modalError.set(
            typeof err?.error === 'string' ? err.error : 'Não foi possível concluir a inscrição agora. Tente novamente em instantes.',
          );
        },
      });
  }
}
