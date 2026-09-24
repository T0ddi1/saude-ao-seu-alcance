import { Routes } from '@angular/router';
import { authGuard } from './core/services/auth.guard';
import { alteracoesNaoSalvasGuard } from './core/guards/alteracoes-nao-salvas.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./features/admin/admin-login.component').then((m) => m.AdminLoginComponent),
    title: 'Login — Admin',
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-layout.component').then((m) => m.AdminLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/dashboard-admin.component').then((m) => m.DashboardAdminComponent),
      },
      {
        path: 'artigos',
        loadComponent: () => import('./features/admin/artigos-admin.component').then((m) => m.ArtigosAdminComponent),
        canDeactivate: [alteracoesNaoSalvasGuard],
      },
      {
        path: 'secoes-home',
        loadComponent: () =>
          import('./features/admin/secoes-home-admin.component').then((m) => m.SecoesHomeAdminComponent),
      },
      {
        path: 'comentarios',
        loadComponent: () =>
          import('./features/admin/comentarios-admin.component').then((m) => m.ComentariosAdminComponent),
      },
      {
        path: 'rodape',
        loadComponent: () =>
          import('./features/admin/rodape-config-admin.component').then((m) => m.RodapeConfigAdminComponent),
        canDeactivate: [alteracoesNaoSalvasGuard],
      },
      {
        path: 'identidade-site',
        loadComponent: () =>
          import('./features/admin/site-config-admin.component').then((m) => m.SiteConfigAdminComponent),
        canDeactivate: [alteracoesNaoSalvasGuard],
      },
      {
        path: 'recurso/:recurso',
        loadComponent: () =>
          import('./features/admin/resource-crud/resource-crud.component').then((m) => m.ResourceCrudComponent),
        canDeactivate: [alteracoesNaoSalvasGuard],
      },
    ],
  },
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
    path: 'entrar',
    loadComponent: () => import('./features/auth/create-account.component').then((m) => m.CreateAccountComponent),
    title: 'Entrar — Saúde ao Seu Alcance',
  },
  {
    path: 'cadastre-se',
    loadComponent: () => import('./features/auth/create-account.component').then((m) => m.CreateAccountComponent),
    title: 'Entrar — Saúde ao Seu Alcance',
  },
  {
    path: 'criar-conta',
    loadComponent: () => import('./features/auth/registrar.component').then((m) => m.RegistrarComponent),
    title: 'Criar nova conta — Saúde ao Seu Alcance',
  },
  {
    path: 'perfil',
    canActivate: [authGuard],
    loadComponent: () => import('./features/auth/perfil.component').then((m) => m.PerfilComponent),
    title: 'Meu Perfil — Saúde ao Seu Alcance',
  },
  {
    path: 'artigos/:categoria/:slug',
    loadComponent: () => import('./features/article/article-page.component').then((m) => m.ArticlePageComponent),
    title: 'Artigo — Saúde ao Seu Alcance',
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
