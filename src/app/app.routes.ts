import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
    title: 'Saúde ao Seu Alcance',
  },
  {
    path: 'blog',
    loadComponent: () => import('./features/blog/blog.component').then((m) => m.BlogComponent),
    title: 'Cuidados com a saúde — Saúde ao Seu Alcance',
  },
  {
    path: 'quem-somos',
    loadComponent: () =>
      import('./features/institutional/institutional-page.component').then((m) => m.InstitutionalPageComponent),
    data: { slug: 'quem-somos' },
    title: 'Quem Somos — Saúde ao Seu Alcance',
  },
  {
    path: 'sobre-o-portal',
    loadComponent: () =>
      import('./features/institutional/institutional-page.component').then((m) => m.InstitutionalPageComponent),
    data: { slug: 'sobre-o-portal' },
    title: 'Sobre o Portal — Saúde ao Seu Alcance',
  },
  {
    path: 'linha-editorial',
    loadComponent: () =>
      import('./features/institutional/institutional-page.component').then((m) => m.InstitutionalPageComponent),
    data: { slug: 'linha-editorial' },
    title: 'Linha Editorial — Saúde ao Seu Alcance',
  },
  {
    path: 'videos',
    loadComponent: () =>
      import('./features/institutional/institutional-page.component').then((m) => m.InstitutionalPageComponent),
    data: { slug: 'videos' },
    title: 'Vídeos — Saúde ao Seu Alcance',
  },
  {
    path: 'lgpd',
    loadComponent: () =>
      import('./features/institutional/institutional-page.component').then((m) => m.InstitutionalPageComponent),
    data: { slug: 'lgpd' },
    title: 'LGPD — Saúde ao Seu Alcance',
  },
  {
    path: 'cadastre-se',
    loadComponent: () => import('./features/auth/create-account.component').then((m) => m.CreateAccountComponent),
    title: 'Criar nova conta — Saúde ao Seu Alcance',
  },
  {
    path: 'artigos/:slug',
    loadComponent: () => import('./features/article/article-page.component').then((m) => m.ArticlePageComponent),
    title: 'Artigo — Saúde ao Seu Alcance',
  },
  {
    path: 'contato',
    loadComponent: () => import('./features/contact/contact.component').then((m) => m.ContactComponent),
    title: 'Contato — Saúde ao Seu Alcance',
  },
  {
    path: 'buscar',
    loadComponent: () => import('./features/search/search-page.component').then((m) => m.SearchPageComponent),
    title: 'Busca — Saúde ao Seu Alcance',
  },
  { path: '**', redirectTo: '' },
];
