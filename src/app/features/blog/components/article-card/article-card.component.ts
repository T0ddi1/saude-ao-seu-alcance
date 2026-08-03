import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlogArticle } from '../../../../core/models/blog.model';

@Component({
  selector: 'app-article-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-card.component.html',
  styleUrl: './article-card.component.scss',
})
export class ArticleCardComponent {
  @Input({ required: true }) article!: BlogArticle;
}
