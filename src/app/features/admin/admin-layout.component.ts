import { Component, HostListener, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { EquipeService } from '../../core/services/equipe.service';
import { SwalService } from '../../core/services/swal.service';

interface ItemMenu {
  rota: string;
  rotulo: string;
  icone: string;
  somenteAdmin?: boolean;
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
export class AdminLayoutComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private equipe = inject(EquipeService);
  private swal = inject(SwalService);

  usuario = this.authService.usuario;
  sidebarAberta = signal(true);
  /** No celular o menu lateral vira uma gaveta que abre por cima do conteúdo. */
  menuMobileAberto = signal(false);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationStart)).subscribe(() => this.menuMobileAberto.set(false));
  }

  /** Ao entrar no painel, avisa uma vez por sessão se há comentários esperando aprovação. */
  ngOnInit(): void {
    const CHAVE = 'sasa_aviso_pendentes_visto';
    try {
      if (sessionStorage.getItem(CHAVE)) return;
      sessionStorage.setItem(CHAVE, '1');
    } catch {
      /* sem sessionStorage: avisa de novo a cada carregamento, sem problema */
    }

    this.equipe.totalComentariosPendentes().subscribe({
      next: async ({ total }) => {
        if (total <= 0) return;
        if (await this.swal.avisoComentariosPendentes(total)) this.router.navigate(['/admin/moderacao']);
      },
      error: () => undefined,
    });
  }

  private gruposFiltrados?: GrupoMenu[];

  /** Menu sem as telas exclusivas de administrador quando quem entrou é Editor. Calculado uma vez: o *ngFor não pode receber um array novo a cada ciclo. */
  get gruposVisiveis(): GrupoMenu[] {
    if (!this.gruposFiltrados) {
      const ehAdmin = this.authService.ehAdmin;
      this.gruposFiltrados = this.grupos
        .map((g) => ({ ...g, itens: g.itens.filter((i) => !i.somenteAdmin || ehAdmin) }))
        .filter((g) => g.itens.length > 0);
    }
    return this.gruposFiltrados;
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
        { rota: '/admin/avisos', rotulo: 'Avisos do site (popup)', icone: 'fa-bell' },
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
      titulo: 'Equipe',
      itens: [
        { rota: '/admin/usuarios', rotulo: 'Usuários', icone: 'fa-users', somenteAdmin: true },
        { rota: '/admin/logs-atividade', rotulo: 'Log de atividades', icone: 'fa-clock-rotate-left', somenteAdmin: true },
        { rota: '/admin/minha-conta', rotulo: 'Minha conta', icone: 'fa-user-gear' },
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
