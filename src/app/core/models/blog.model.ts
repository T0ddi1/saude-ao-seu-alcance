export interface Breadcrumb {
  label: string;
  href: string;
}

export interface BlogArticle {
  date: string;
  title: string;
  excerpt: string;
  image: string | null;
  href: string;
  sponsored?: boolean;
}

export interface BlogCategory {
  label: string;
  count: number;
  href: string;
  active: boolean;
}

export interface RecentPost {
  date: string;
  excerpt: string;
  href: string;
}

export interface BlogPageData {
  breadcrumbs: Breadcrumb[];
  pageTitle: string;
  articles: BlogArticle[];
  categories: BlogCategory[];
  recentPosts: RecentPost[];
  extras: import('./content.model').SidebarExtra[];
  pagination: {
    current: number;
    total: number;
  };
}
