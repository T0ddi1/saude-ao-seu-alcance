import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { ArticleComment, ArticleDetail } from '../models/article.model';
import { ArticleDetailApi, CommentApi, PagedResultApi, ArticleSummaryApi } from '../models/article-api.model';
import { environment } from '../../../environments/environment';
import { parseContentHtml } from '../utils/content-html.util';

interface CategoriaApi {
  nome: string;
  slug: string;
  quantidade: number;
}

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private http = inject(HttpClient);
  private readonly basePath = `${environment.apiBaseUrl}/artigos`;
  private readonly categoriasPath = `${environment.apiBaseUrl}/categorias`;

  getArticle(slug: string): Observable<ArticleDetail> {
    return forkJoin({
      artigo: this.http.get<ArticleDetailApi>(`${this.basePath}/${slug}`),
      recentes: this.http
        .get<PagedResultApi<ArticleSummaryApi>>(`${this.basePath}?pagina=1&tamanhoPagina=4`)
        .pipe(catchError(() => of({ itens: [], paginaAtual: 1, totalPaginas: 0, totalItens: 0 } as PagedResultApi<ArticleSummaryApi>))),
      comentarios: this.getComments(slug).pipe(catchError(() => of([] as ArticleComment[]))),
      categorias: this.http
        .get<CategoriaApi[]>(this.categoriasPath)
        .pipe(catchError(() => of([] as CategoriaApi[]))),
    }).pipe(
      map(({ artigo, recentes, comentarios, categorias }) =>
        this.mapToArticleDetail(artigo, slug, recentes.itens, comentarios, categorias),
      ),
    );
  }

  getComments(slug: string): Observable<ArticleComment[]> {
    return this.http
      .get<CommentApi[]>(`${this.basePath}/${slug}/comentarios`)
      .pipe(map((itens) => itens.map(this.mapComment)));
  }

  postComment(slug: string, text: string, parentCommentId: number | null = null): Observable<ArticleComment> {
    return this.http
      .post<CommentApi>(`${this.basePath}/${slug}/comentarios`, { text, parentCommentId })
      .pipe(map(this.mapComment));
  }

  toggleCommentLike(commentId: number): Observable<{ curtido: boolean; total: number }> {
    return this.http.post<{ curtido: boolean; total: number }>(`${this.basePath}/comentarios/${commentId}/curtir`, {});
  }

  toggleFavorite(slug: string): Observable<{ favoritado: boolean }> {
    return this.http.post<{ favoritado: boolean }>(`${this.basePath}/${slug}/favorito`, {});
  }

  private mapComment = (c: CommentApi): ArticleComment => ({
    id: c.id,
    name: c.authorName,
    photo: c.authorPhoto,
    date: new Date(c.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }),
    text: c.text,
    likes: c.likes,
    likedByMe: c.likedByMe,
    replies: (c.replies ?? []).map(this.mapComment),
  });

  private mapToArticleDetail(
    dto: ArticleDetailApi,
    slug: string,
    recentes: ArticleSummaryApi[],
    comentarios: ArticleComment[],
    categorias: CategoriaApi[],
  ): ArticleDetail {
    return {
      slug,
      breadcrumbs: [
        { label: 'Início', href: '/' },
        { label: 'Blog', href: '/blog' },
        ...(dto.category ? [{ label: dto.category, href: `/blog?categoria=${dto.categorySlug}` }] : []),
        { label: dto.title, href: `/artigos/${dto.categorySlug}/${slug}` },
      ],
      title: dto.title,
      subtitle: dto.excerpt,
      date: this.formatarData(dto.publishedAt),
      publishedAtIso: dto.publishedAt,
      updatedAtIso: dto.updatedAt,
      author: dto.author ?? 'Redação Saúde ao Seu Alcance',
      authorRole: dto.authorRole ?? undefined,
      shareLinks: [
        { icon: 'facebook', href: '#', label: 'Compartilhar no Facebook' },
        { icon: 'whatsapp', href: '#', label: 'Compartilhar no WhatsApp' },
        { icon: 'linkedin', href: '#', label: 'Compartilhar no LinkedIn' },
        { icon: 'x', href: '#', label: 'Compartilhar no X' },
      ],
      heroImage: dto.image,
      blocks: parseContentHtml(dto.contentHtml),
      categories: categorias.map((c) => ({
        label: c.nome,
        count: c.quantidade,
        href: `/blog?categoria=${c.slug}`,
        active: c.slug === dto.categorySlug,
      })),
      recentPosts: recentes
        .filter((a) => a.slug !== slug)
        .slice(0, 3)
        .map((a) => ({ date: this.formatarData(a.publishedAt), excerpt: a.title, href: `/artigos/${a.categorySlug}/${a.slug}` })),
      extras: [],
      comments: comentarios,
      favoritedByMe: dto.favoritedByMe,
    };
  }

  private formatarData(iso: string | null): string {
    if (!iso) return '';
    const data = new Date(iso);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  }
}
