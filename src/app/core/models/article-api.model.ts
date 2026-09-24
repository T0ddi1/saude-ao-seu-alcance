export interface ArticleSummaryApi {
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  category: string;
  categorySlug: string;
  author: string | null;
  publishedAt: string | null;
}

export interface ArticleDetailApi extends ArticleSummaryApi {
  authorRole: string | null;
  contentHtml: string;
  views: number;
  favoritedByMe: boolean;
}

export interface PagedResultApi<T> {
  itens: T[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

export interface CommentApi {
  id: number;
  authorName: string;
  authorPhoto: string | null;
  text: string;
  createdAt: string;
  likes: number;
  likedByMe: boolean;
  replies: CommentApi[];
}
