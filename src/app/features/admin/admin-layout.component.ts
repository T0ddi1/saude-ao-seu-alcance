import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
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

  grupos: GrupoMenu[] = [
    {
      titulo: 'Visão geral',
      itens: [{ rota: '/admin/dashboard', rotulo: 'Dashboard', icone: 'fa-chart-line' }],
    },
    {
      titulo: 'Conteúdo',
      itens: [
        { rota: '/admin/artigos', rotulo: 'Artigos', icone: 'fa-newspaper' },
        { rota: '/admin/comentarios', rotulo: 'Comentários', icone: 'fa-comments' },
        { rota: '/admin/recurso/palavras-bloqueadas', rotulo: 'Palavras Bloqueadas', icone: 'fa-ban' },
        { rota: '/admin/recurso/categorias', rotulo: 'Categorias', icone: 'fa-tags' },
        { rota: '/admin/recurso/paginas-institucionais', rotulo: 'Páginas Institucionais', icone: 'fa-file-lines' },
        { rota: '/admin/observatorio', rotulo: 'Observatório', icone: 'fa-binoculars' },
      ],
    },
    {
      titulo: 'Home',
      itens: [
        { rota: '/admin/secoes-home', rotulo: 'Seções da Home', icone: 'fa-table-cells-large' },
        { rota: '/admin/recurso/slides-destaque', rotulo: 'Slides do Carrossel', icone: 'fa-images' },
        { rota: '/admin/recurso/cards-conteudo', rotulo: 'Cards de Conteúdo', icone: 'fa-th-large' },
        { rota: '/admin/recurso/espacos-patrocinados', rotulo: 'Espaços Patrocinados', icone: 'fa-bullhorn' },
        { rota: '/admin/recurso/dados-saude', rotulo: 'Dados da Saúde', icone: 'fa-chart-simple' },
        { rota: '/admin/recurso/selos-confianca', rotulo: 'Selos de Confiança', icone: 'fa-shield-halved' },
      ],
    },
    {
      titulo: 'Navegação',
      itens: [
        { rota: '/admin/recurso/menu-itens', rotulo: 'Menu — Itens', icone: 'fa-bars' },
        { rota: '/admin/recurso/menu-links', rotulo: 'Menu — Links', icone: 'fa-link' },
      ],
    },
    {
      titulo: 'Rodapé',
      itens: [
        { rota: '/admin/rodape', rotulo: 'Textos e Newsletter', icone: 'fa-align-left' },
        { rota: '/admin/recurso/footer-links', rotulo: 'Links por Coluna', icone: 'fa-link' },
        { rota: '/admin/recurso/footer-redes-sociais', rotulo: 'Redes Sociais', icone: 'fa-share-nodes' },
        { rota: '/admin/recurso/footer-projetos-especiais', rotulo: 'Projetos Especiais', icone: 'fa-heart' },
      ],
    },
    {
      titulo: 'Leads',
      itens: [
        { rota: '/admin/recurso/especialidades', rotulo: 'Especialidades', icone: 'fa-user-doctor' },
        { rota: '/admin/recurso/origens-lead', rotulo: 'Origens do lead', icone: 'fa-location-crosshairs' },
        { rota: '/admin/recurso/tipos-interesse', rotulo: 'Tipos de interesse', icone: 'fa-bullseye' },
        { rota: '/admin/recurso/campanhas', rotulo: 'Campanhas (UTM)', icone: 'fa-bullhorn' },
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
