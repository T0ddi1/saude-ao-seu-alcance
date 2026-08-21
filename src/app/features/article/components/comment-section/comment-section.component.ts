import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { ArticleComment } from '../../../../core/models/article.model';
import { TotemService } from '../../../../core/services/totem.service';

@Component({
  selector: 'app-comment-section',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss',
})
export class CommentSectionComponent {
  @Input({ required: true }) comments!: ArticleComment[];

  constructor(public totem: TotemService) {}

  /** Flip to true once comments have a real backend to post to. */
  commentsEnabled = false;

  name = '';
  email = '';
  message = '';
  saveInfo = false;
  posted = signal(false);

  onSubmit(): void {
    if (!this.commentsEnabled || !this.name || !this.email || !this.message) {
      return;
    }
    // TODO: POST to the real comments endpoint once available
    this.comments = [{ name: this.name, date: 'Agora', text: this.message }, ...this.comments];
    this.name = '';
    this.email = '';
    this.message = '';
    this.posted.set(true);
  }
}
