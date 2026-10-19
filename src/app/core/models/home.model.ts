export type IconGlyph = 'ring' | 'ribbon' | 'dot' | 'cross' | 'square' | 'doc' | 'mic' | 'play' | 'arrow-right' | 'search' | 'bookmark' | 'chevron-down';

export interface FeaturedArticle {
  eyebrow: string;
  title: string;
  excerpt: string;
  ctaLabel: string;
  href: string;
  
  image?: string;
}

export interface TrendingItem {
  title: string;
  href: string;
  
  score: number;
}

export interface TrendingData {
  
  label: string;
  
  limit: number;
  items: TrendingItem[];
  href: string;
  linkLabel: string;
}

export interface ContentCard {
  icon: IconGlyph;
  title: string;
  image: string | null;
  excerpt: string;
  linkLabel: string;
  href: string;
  sponsored?: boolean;
}

export interface HealthStat {
  label: string;
  value: string;
  sublabel: string;
}

export interface ContentCategory {
  icon: IconGlyph;
  title: string;
  description: string;
  linkLabel: string;
  href: string;
  image?: string | null;
}

export interface SponsoredItem {
  kind: 'ad' | 'sponsored' | 'sponsorship';
  eyebrow: string;
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
  image: string | null;
  imagePosition?: string;
  
  theme: 'light' | 'dark' | 'brand' | 'banner';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logo?: string | null;
  siteLabel?: string | null;
  external?: boolean;
  /** Cor de fundo (#RRGGBB) do card "brand"; vazio = cor padrão do site. */
  backgroundColor?: string | null;
}

export interface TrustBadge {
  icon: IconGlyph;
  label: string;
}

export interface HealthStatsData {
  title: string;
  stats: HealthStat[];
}

interface BlocoHomeBase {
  id: number;
  /** Largura do bloco numa grade de 12 colunas. */
  colunas: number;
  titulo: string | null;
}

export interface BlocoHomeCarrossel extends BlocoHomeBase {
  tipo: 'Carrossel';
  featuredArticles: FeaturedArticle[];
  autoplaySegundos: number;
}

export interface BlocoHomeEmAlta extends BlocoHomeBase {
  tipo: 'EmAlta';
  trending: TrendingData;
}

export interface BlocoHomeGradeArtigos extends BlocoHomeBase {
  tipo: 'GradeArtigos';
  contentCards: ContentCard[];
}

export interface BlocoHomeDadosSaude extends BlocoHomeBase {
  tipo: 'DadosSaude';
  healthStats: HealthStatsData;
}

export interface BlocoHomePatrocinio extends BlocoHomeBase {
  tipo: 'Patrocinio';
  sponsored: SponsoredItem[];
}

export interface BlocoHomeSelosConfianca extends BlocoHomeBase {
  tipo: 'SelosConfianca';
  trustBadges: TrustBadge[];
}

export interface BlocoHomeTexto extends BlocoHomeBase {
  tipo: 'Texto';
  conteudoHtml: string;
}

export type BlocoHome =
  | BlocoHomeCarrossel
  | BlocoHomeEmAlta
  | BlocoHomeGradeArtigos
  | BlocoHomeDadosSaude
  | BlocoHomePatrocinio
  | BlocoHomeSelosConfianca
  | BlocoHomeTexto;

export interface HomePageData {
  blocos: BlocoHome[];
}
