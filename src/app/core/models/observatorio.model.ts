import { Breadcrumb, BlogArticle } from './blog.model';
import { ContentBlock } from './content.model';

export interface IndicadorObservatorio {
  rotulo: string;
  valor: string;
  complemento: string | null;
}

export interface SecaoObservatorioResumo {
  nome: string;
  slug: string;
  resumo: string | null;
  icone: string | null;
}

export interface BlocoTexto {
  tipo: 'Texto';
  titulo: string | null;
  blocos: ContentBlock[];
}

export interface BlocoIndicadores {
  tipo: 'Indicadores';
  titulo: string | null;
  indicadores: IndicadorObservatorio[];
}

export interface BlocoGradeArtigos {
  tipo: 'GradeArtigos';
  titulo: string | null;
  artigos: BlogArticle[];
}

export interface BlocoCardsSecoes {
  tipo: 'CardsSecoes';
  titulo: string | null;
  secoes: SecaoObservatorioResumo[];
}

export type BlocoObservatorioPublico = BlocoTexto | BlocoIndicadores | BlocoGradeArtigos | BlocoCardsSecoes;

export interface ObservatorioHubData {
  breadcrumbs: Breadcrumb[];
  blocos: BlocoObservatorioPublico[];
}

export interface ObservatorioSecaoData {
  breadcrumbs: Breadcrumb[];
  slug: string;
  nome: string;
  resumo: string | null;
  icone: string | null;
  blocos: BlocoObservatorioPublico[];
}
