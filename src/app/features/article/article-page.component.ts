import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { ArticleDetail } from '../../core/models/article.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ContentSidebarComponent } from '../../shared/components/content-sidebar/content-sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CommentSectionComponent } from './components/comment-section/comment-section.component';

@Component({
  selector: 'app-article-page',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, ContentSidebarComponent, IconComponent, CommentSectionComponent],
  templateUrl: './article-page.component.html',
  styleUrl: './article-page.component.scss',
})
export class ArticlePageComponent implements OnInit {
  data = signal<ArticleDetail | null>(null);

  constructor(private route: ActivatedRoute, private articleService: ArticleService) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((params) => this.articleService.getArticle(params.get('slug') ?? '')))
      .subscribe((data) => this.data.set(data));
  }
}
