import { Breadcrumb, BlogCategory, RecentPost } from './blog.model';
import { SidebarExtra, ContentBlock } from './content.model';

export interface ShareLink {
  icon: 'facebook' | 'whatsapp' | 'linkedin' | 'x';
  href: string;
  label: string;
}

export interface ArticleComment {
  id: number;
  name: string;
  photo: string | null;
  date: string;
  text: string;
  likes: number;
  likedByMe: boolean;
  replies: ArticleComment[];
}

export interface ArticleDetail {
  slug: string;
  breadcrumbs: Breadcrumb[];
  title: string;
  subtitle: string;
  date: string;
  publishedAtIso: string | null;
  updatedAtIso: string | null;
  author: string;
  authorRole?: string;
  shareLinks: ShareLink[];
  heroImage: string | null;
  blocks: ContentBlock[];
  categories: BlogCategory[];
  recentPosts: RecentPost[];
  extras: SidebarExtra[];
  comments: ArticleComment[];
  favoritedByMe: boolean;
}
