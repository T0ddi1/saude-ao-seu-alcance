export type IconGlyph = 'ring' | 'dot' | 'cross' | 'square' | 'doc' | 'mic' | 'play' | 'arrow-right' | 'search' | 'bookmark' | 'chevron-down';

export interface FeaturedArticle {
  eyebrow: string;
  title: string;
  excerpt: string;
  ctaLabel: string;
  href: string;
  slidesCount: number;
  activeSlide: number;
}

export interface TrendingItem {
  rank: number;
  title: string;
  href: string;
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
  theme: 'light' | 'dark' | 'brand';
}

export interface TrustBadge {
  icon: IconGlyph;
  label: string;
}

export interface HomePageData {
  featuredArticle: FeaturedArticle;
  trending: TrendingItem[];
  contentCards: ContentCard[];
  healthStats: {
    title: string;
    stats: HealthStat[];
  };
  contentCategories: ContentCategory[];
  sponsored: SponsoredItem[];
  trustBadges: TrustBadge[];
}
