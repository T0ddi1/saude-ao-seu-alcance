import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, of, catchError } from 'rxjs';
import { InstitutionalPageData } from '../models/content.model';
import { PagedResultApi, ArticleSummaryApi } from '../models/article-api.model';
import { environment } from '../../../environments/environment';
import { parseContentHtml } from '../utils/content-html.util';

interface PaginaInstitucionalApi {
  title: string;
  description: string | null;
  contentHtml: string;
  image: string | null;
  attachmentUrl: string | null;
  attachmentLabel: string | null;
}

@Injectable({ providedIn: 'root' })
export class InstitutionalPageService {
  private http = inject(HttpClient);
  private readonly basePath = `${environment.apiBaseUrl}/paginas`;
  private readonly artigosPath = `${environment.apiBaseUrl}/artigos`;

  getPage(slug: string): Observable<InstitutionalPageData> {
    return forkJoin({
      pagina: this.http.get<PaginaInstitucionalApi>(`${this.basePath}/${slug}`),
      recentes: this.http
        .get<PagedResultApi<ArticleSummaryApi>>(`${this.artigosPath}?pagina=1&tamanhoPagina=3`)
        .pipe(catchError(() => of({ itens: [], paginaAtual: 1, totalPaginas: 0, totalItens: 0 } as PagedResultApi<ArticleSummaryApi>))),
    }).pipe(
      map(({ pagina, recentes }) => ({
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: pagina.title, href: `/${slug}` },
        ],
        title: pagina.title,
        description: pagina.description,
        blocks: [
          ...parseContentHtml(pagina.contentHtml),
          ...(pagina.attachmentUrl
            ? [{
                type: 'download' as const,
                label: 'Baixar ' + pagina.title,
                fileLabel: pagina.attachmentLabel ?? '',
                href: pagina.attachmentUrl,
              }]
            : []),
        ],
        categories: [],
        recentPosts: recentes.itens.map((a) => ({
          date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-BR') : '',
          excerpt: a.title,
          href: `/artigos/${a.categorySlug}/${a.slug}`,
        })),
        extras: [],
      })),
    );
  }
}
