import { IconGlyph } from './home.model';
import { Breadcrumb, BlogCategory, RecentPost } from './blog.model';

export type SidebarExtra =
  | { kind: 'ad'; title: string; ctaLabel: string; href: string }
  | { kind: 'sponsor'; icon: IconGlyph; title: string; image: string | null; description: string; linkLabel: string; href: string }
  | { kind: 'brand'; logoText: string; subtitle: string; title: string; ctaLabel: string; href: string };

export type ContentSegment = { text: string; strong?: boolean };

export type ContentBlock =
  | { type: 'lead'; segments: ContentSegment[] }
  | { type: 'paragraph'; text: string }
  | { type: 'display'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string };

export interface InstitutionalPageData {
  breadcrumbs: Breadcrumb[];
  title: string;
  blocks: ContentBlock[];
  categories: BlogCategory[];
  recentPosts: RecentPost[];
  extras: SidebarExtra[];
}
