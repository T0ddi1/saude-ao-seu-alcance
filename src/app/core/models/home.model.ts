export type IconGlyph = 'ring' | 'dot' | 'cross' | 'square' | 'doc' | 'mic' | 'play' | 'arrow-right' | 'search' | 'bookmark' | 'chevron-down';

export interface FeaturedArticle {
  eyebrow: string;
  title: string;
  excerpt: string;
  ctaLabel: string;
  href: string;
}

export interface TrendingItem {
  title: string;
  href: string;
  /** Engagement score from the API (views, clicks…) — determines rank order. */
  score: number;
}

export interface TrendingData {
  /** Heading label for the panel, e.g. "Em alta" or "Mais lidos da semana" — comes from the API. */
  label: string;
  /** How many top items to show — comes from the API. */
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
  theme: 'light' | 'dark' | 'brand';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  logo?: string | null;
  siteLabel?: string | null;
  external?: boolean;
}

export interface TrustBadge {
  icon: IconGlyph;
  label: string;
}

export interface HomePageData {
  featuredArticles: FeaturedArticle[];
  trending: TrendingData;
  contentCards: ContentCard[];
  healthStats: {
    title: string;
    stats: HealthStat[];
  };
  contentCategories: ContentCategory[];
  sponsored: SponsoredItem[];
  trustBadges: TrustBadge[];
}
