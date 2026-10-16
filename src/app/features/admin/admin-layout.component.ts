import { Component, HostListener, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface ItemMenu {
  rota: string;
  rotulo: string;
  icone: string;
}

interface GrupoMenu {
  titulo: string;
  itens: ItemMenu[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  usuario = this.authService.usuario;
  sidebarAberta = signal(true);
  /** No celular o menu lateral vira uma gaveta que abre por cima do conteúdo. */
  menuMobileAberto = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe(() => this.menuMobileAberto.set(false));
  }

  get ehTelaPequena(): boolean {
    return window.matchMedia('(max-width: 900px)').matches;
  }

  abrirMenuMobile(): void {
    this.menuMobileAberto.set(true);
  }

  fecharMenuMobile(): void {
    this.menuMobileAberto.set(false);
  }

  /** O botão de recolher vira "fechar" quando o menu é uma gaveta. */
  aoClicarRecolher(): void {
    if (this.ehTelaPequena) this.fecharMenuMobile();
    else this.toggleSidebar();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.fecharMenuMobile();
  }

  grupos: GrupoMenu[] = [
    {
      titulo: 'Visão geral',
      itens: [{ rota: '/admin/dashboard', rotulo: 'Dashboard', icone: 'fa-chart-line' }],
    },
    {
      titulo: 'Conteúdo',
      itens: [
        { rota: '/admin/artigos', rotulo: 'Artigos', icone: 'fa-newspaper' },
        { rota: '/admin/moderacao', rotulo: 'Moderação', icone: 'fa-comments' },
        { rota: '/admin/recurso/categorias', rotulo: 'Categorias', icone: 'fa-tags' },
        { rota: '/admin/paginas', rotulo: 'Páginas Institucionais', icone: 'fa-file-lines' },
        { rota: '/admin/observatorio', rotulo: 'Observatório', icone: 'fa-binoculars' },
      ],
    },
    {
      titulo: 'Home',
      itens: [
        { rota: '/admin/home', rotulo: 'Página inicial', icone: 'fa-table-cells-large' },
      ],
    },
    {
      titulo: 'Navegação',
      itens: [
        { rota: '/admin/menu', rotulo: 'Menu do site', icone: 'fa-bars' },
      ],
    },
    {
      titulo: 'Rodapé',
      itens: [
        { rota: '/admin/rodape', rotulo: 'Rodapé', icone: 'fa-align-left' },
      ],
    },
    {
      titulo: 'Leads',
      itens: [
        { rota: '/admin/leads', rotulo: 'Leads', icone: 'fa-bullseye' },
      ],
    },
    {
      titulo: 'Configurações',
      itens: [
        { rota: '/admin/identidade-site', rotulo: 'Identidade do Site', icone: 'fa-palette' },
        { rota: '/admin/logs-erro', rotulo: 'Log de Erros', icone: 'fa-triangle-exclamation' },
      ],
    },
  ];

  toggleSidebar(): void {
    this.sidebarAberta.update((v) => !v);
  }

  sair(): void {
    this.authService.logout();
    this.router.navigate(['/admin/login']);
  }
}
