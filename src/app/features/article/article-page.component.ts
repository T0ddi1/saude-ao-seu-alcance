import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { ArticleService } from '../../core/services/article.service';
import { AuthService } from '../../core/services/auth.service';
import { SeoService } from '../../core/services/seo.service';
import { SwalService } from '../../core/services/swal.service';
import { ArticleComment, ArticleDetail } from '../../core/models/article.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ContentSidebarComponent } from '../../shared/components/content-sidebar/content-sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CommentSectionComponent, ComentarioEnviarEvento } from './components/comment-section/comment-section.component';

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
    public authService: AuthService,
    private seo: SeoService,
    private swal: SwalService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((params) => this.articleService.getArticle(params.get('slug') ?? '')))
      .subscribe((data) => {
        this.data.set(data);
        this.setSocialMeta(data);
        this.setStructuredData(data);
      });
  }

  alternarFavorito(): void {
    const atual = this.data();
    if (!atual || !this.authService.estaLogado) return;

    this.articleService.toggleFavorite(atual.slug).subscribe(({ favoritado }) => {
      this.data.set({ ...atual, favoritedByMe: favoritado });
    });
  }

  enviarComentario(evt: ComentarioEnviarEvento): void {
    const atual = this.data();
    if (!atual) {
      evt.aoConcluir(false);
      return;
    }

    this.articleService.postComment(atual.slug, evt.texto, evt.comentarioPaiId).subscribe({
      next: () => evt.aoConcluir(true),
      error: () => {
        evt.aoConcluir(false);
        this.swal.erro('Seu comentário não pôde ser publicado. O texto contém termos não permitidos.');
      },
    });
  }

  curtirComentario(comentarioId: number): void {
    const atual = this.data();
    if (!atual) return;

    this.articleService.toggleCommentLike(comentarioId).subscribe(({ curtido, total }) => {
      const comments = atualizarCurtida(atual.comments, comentarioId, curtido, total);
      this.data.set({ ...atual, comments });
    });
  }

  private setSocialMeta(article: ArticleDetail): void {
    this.seo.setMeta({
      title: article.title,
      description: article.subtitle,
      image: article.heroImage,
      type: 'article',
    });
  }

  private setStructuredData(article: ArticleDetail): void {
    const imageUrl = article.heroImage ? new URL(article.heroImage, window.location.origin).href : undefined;

    this.seo.setStructuredData({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title,
      description: article.subtitle,
      ...(imageUrl ? { image: [imageUrl] } : {}),
      ...(article.publishedAtIso ? { datePublished: article.publishedAtIso } : {}),
      dateModified: article.updatedAtIso ?? article.publishedAtIso ?? undefined,
      author: {
        '@type': 'Person',
        name: article.author,
        ...(article.authorRole ? { jobTitle: article.authorRole } : {}),
      },
      publisher: {
        '@type': 'Organization',
        name: 'Saúde ao Seu Alcance',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': window.location.href,
      },
    });
  }

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

function atualizarCurtida(comments: ArticleComment[], id: number, curtido: boolean, total: number): ArticleComment[] {
  return comments.map((c) =>
    c.id === id
      ? { ...c, likedByMe: curtido, likes: total }
      : { ...c, replies: atualizarCurtida(c.replies, id, curtido, total) },
  );
}
