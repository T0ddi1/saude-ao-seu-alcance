import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Meta, Title } from '@angular/platform-browser';
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

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private meta: Meta,
    private titleService: Title
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((params) => this.articleService.getArticle(params.get('slug') ?? '')))
      .subscribe((data) => {
        this.data.set(data);
        this.setSocialMeta(data);
      });
  }

  /**
   * Facebook and LinkedIn build their share preview by scraping these Open
   * Graph tags from the page — without them (or on an unreachable URL like
   * localhost) they fall back to a blank "create post" composer instead of
   * a real link share. WhatsApp/X don't need this since they don't scrape.
   */
  private setSocialMeta(article: ArticleDetail): void {
    const pageTitle = `${article.title} — Saúde ao Seu Alcance`;
    const imageUrl = article.heroImage ? new URL(article.heroImage, window.location.origin).href : '';

    this.titleService.setTitle(pageTitle);

    const tags: { property?: string; name?: string; content: string }[] = [
      { property: 'og:type', content: 'article' },
      { property: 'og:title', content: article.title },
      { property: 'og:description', content: article.subtitle },
      { property: 'og:url', content: window.location.href },
      { property: 'og:site_name', content: 'Saúde ao Seu Alcance' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: article.title },
      { name: 'twitter:description', content: article.subtitle },
    ];
    if (imageUrl) {
      tags.push({ property: 'og:image', content: imageUrl }, { name: 'twitter:image', content: imageUrl });
    }

    for (const tag of tags) {
      this.meta.updateTag(tag, tag.property ? `property="${tag.property}"` : `name="${tag.name}"`);
    }
  }

  /** Builds the real share-intent URL for the current article — the mock JSON's own `href: '#'` can't know the live page URL. */
  shareUrl(icon: string): string {
    const pageUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(this.data()?.title ?? '');

    switch (icon) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`;
      case 'whatsapp':
        return `https://api.whatsapp.com/send?text=${title}%20${pageUrl}`;
      case 'linkedin':
        return `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`;
      case 'x':
        return `https://twitter.com/intent/tweet?url=${pageUrl}&text=${title}`;
      default:
        return window.location.href;
    }
  }
}
