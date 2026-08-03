import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-newsletter-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './newsletter-form.component.html',
  styleUrl: './newsletter-form.component.scss',
})
export class NewsletterFormComponent {
  @Input() placeholder = 'Seu e-mail';
  @Input() ctaLabel = 'Inscrever';

  email = '';
  submitted = signal(false);

  onSubmit(): void {
    if (!this.email.includes('@')) {
      return;
    }
    // TODO: replace with a real subscribe API call once available
    this.submitted.set(true);
  }
}
