import { Breadcrumb, BlogCategory, RecentPost } from './blog.model';
import { SidebarExtra, ContentBlock } from './content.model';

export interface ShareLink {
  icon: 'facebook' | 'whatsapp' | 'linkedin' | 'x';
  href: string;
  label: string;
}

export interface ArticleComment {
  name: string;
  date: string;
  text: string;
}

export interface ArticleDetail {
  breadcrumbs: Breadcrumb[];
  title: string;
  subtitle: string;
  date: string;
  author: string;
  authorRole?: string;
  shareLinks: ShareLink[];
  heroImage: string | null;
  blocks: ContentBlock[];
  categories: BlogCategory[];
  recentPosts: RecentPost[];
  extras: SidebarExtra[];
  comments: ArticleComment[];
}
