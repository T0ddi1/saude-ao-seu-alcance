import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parseContentHtml } from '../utils/content-html.util';
import { ArticleSummaryApi } from '../models/article-api.model';
import { BlocoObservatorioPublico, ObservatorioHubData, ObservatorioSecaoData, SecaoObservatorioResumo } from '../models/observatorio.model';

interface CategoriaApi {
  nome: string;
  slug: string;
  resumo: string | null;
  icone: string | null;
  ehSecaoObservatorio: boolean;
  quantidade: number;
}

interface IndicadorApi {
  rotulo: string;
  valor: string;
  complemento: string | null;
}

interface BlocoApi {
  tipo: 'Texto' | 'Indicadores' | 'GradeArtigos' | 'CardsSecoes';
  titulo: string | null;
  conteudoHtml?: string;
  indicadores?: IndicadorApi[];
  artigos?: ArticleSummaryApi[];
  secoes?: SecaoObservatorioResumo[];
}

@Injectable({ providedIn: 'root' })
export class ObservatorioService {
  private http = inject(HttpClient);
  private readonly categoriasPath = `${environment.apiBaseUrl}/categorias`;
  private readonly observatorioPath = `${environment.apiBaseUrl}/observatorio`;

  getHub(): Observable<ObservatorioHubData> {
    return this.http.get<BlocoApi[]>(`${this.observatorioPath}/blocos`).pipe(
      map((blocosApi) => ({
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Observatório', href: '/observatorio' },
        ],
        blocos: blocosApi.map((b) => this.paraBloco(b)),
      })),
    );
  }

  getSecao(slug: string): Observable<ObservatorioSecaoData> {
    return forkJoin({
      secaoAtual: this.http.get<CategoriaApi>(`${this.categoriasPath}/${slug}`),
      blocosApi: this.http.get<BlocoApi[]>(`${this.categoriasPath}/${slug}/blocos`),
    }).pipe(
      map(({ secaoAtual, blocosApi }) => ({
        breadcrumbs: [
          { label: 'Home', href: '/' },
          { label: 'Observatório', href: '/observatorio' },
          { label: secaoAtual.nome, href: `/observatorio/${slug}` },
        ],
        slug,
        nome: secaoAtual.nome,
        resumo: secaoAtual.resumo,
        icone: secaoAtual.icone,
        blocos: blocosApi.map((b) => this.paraBloco(b)),
      })),
    );
  }

  private paraBloco(bloco: BlocoApi): BlocoObservatorioPublico {
    switch (bloco.tipo) {
      case 'Texto':
        return { tipo: 'Texto', titulo: bloco.titulo, blocos: parseContentHtml(bloco.conteudoHtml ?? '') };
      case 'Indicadores':
        return { tipo: 'Indicadores', titulo: bloco.titulo, indicadores: bloco.indicadores ?? [] };
      case 'CardsSecoes':
        return { tipo: 'CardsSecoes', titulo: bloco.titulo, secoes: bloco.secoes ?? [] };
      case 'GradeArtigos':
        return {
          tipo: 'GradeArtigos',
          titulo: bloco.titulo,
          artigos: (bloco.artigos ?? []).map((a) => ({
            date: this.formatarData(a.publishedAt),
            title: a.title,
            excerpt: a.excerpt,
            image: a.image,
            href: `/artigos/${a.categorySlug}/${a.slug}`,
          })),
        };
    }
  }

  private formatarData(iso: string | null): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }
}
