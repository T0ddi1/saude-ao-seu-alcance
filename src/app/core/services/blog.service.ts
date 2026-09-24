import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { BlogPageData } from '../models/blog.model';
import { ArticleSummaryApi, PagedResultApi } from '../models/article-api.model';
import { environment } from '../../../environments/environment';

interface CategoriaApi {
  nome: string;
  slug: string;
  quantidade: number;
}

const TAMANHO_PAGINA = 6;

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private readonly artigosPath = `${environment.apiBaseUrl}/artigos`;
  private readonly categoriasPath = `${environment.apiBaseUrl}/categorias`;

  getBlogPage(pagina = 1, categoriaSlug?: string | null): Observable<BlogPageData> {
    const filtroCategoria = categoriaSlug ? `&categoria=${categoriaSlug}` : '';

    return forkJoin({
      paginaAtual: this.http.get<PagedResultApi<ArticleSummaryApi>>(
        `${this.artigosPath}?pagina=${pagina}&tamanhoPagina=${TAMANHO_PAGINA}${filtroCategoria}`,
      ),
      categorias: this.http.get<CategoriaApi[]>(this.categoriasPath),
      recentes: this.http.get<PagedResultApi<ArticleSummaryApi>>(`${this.artigosPath}?pagina=1&tamanhoPagina=3`),
    }).pipe(
      map(({ paginaAtual, categorias, recentes }) => ({
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Artigos', href: '/blog' },
        ],
        pageTitle: categoriaSlug ? (categorias.find((c) => c.slug === categoriaSlug)?.nome ?? 'Artigos') : 'Cuidados com a saúde',
        articles: paginaAtual.itens.map((a) => ({
          date: this.formatarData(a.publishedAt),
          title: a.title,
          excerpt: a.excerpt,
          image: a.image,
          href: `/artigos/${a.categorySlug}/${a.slug}`,
        })),
        categories: categorias.map((c) => ({
          label: c.nome,
          count: c.quantidade,
          href: `/blog?categoria=${c.slug}`,
          active: c.slug === categoriaSlug,
        })),
        recentPosts: recentes.itens.map((a) => ({
          date: this.formatarData(a.publishedAt),
          excerpt: a.title,
          href: `/artigos/${a.categorySlug}/${a.slug}`,
        })),
        extras: [],
        pagination: { current: paginaAtual.paginaAtual, total: paginaAtual.totalPaginas || 1 },
      })),
    );
  }

  private formatarData(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
