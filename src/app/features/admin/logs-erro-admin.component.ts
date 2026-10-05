import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DialogFocoDirective } from '../../shared/directives/dialog-foco.directive';

interface LogErroAdmin {
  id: number;
  categoria: string;
  mensagem: string;
  origem: string | null;
  detalhes: string | null;
  criadoEm: string;
}

interface PaginaLogsErro {
  itens: LogErroAdmin[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

interface PontoSerie {
  rotulo: string;
  total: number;
}

interface ResumoLogsErro {
  total: number;
  ultimas24Horas: number;
  porCategoria: PontoSerie[];
}

const TAMANHO_PAGINA = 20;

const ROTULOS_CATEGORIA: Record<string, string> = {
  Email: 'E-mail',
  IntegracaoExterna: 'Integração externa',
  Autenticacao: 'Autenticação',
  Requisicao: 'Requisição',
  Sistema: 'Sistema',
};

@Component({
  selector: 'app-logs-erro-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogFocoDirective],
  templateUrl: './logs-erro-admin.component.html',
  styleUrl: './logs-erro-admin.component.scss',
})
export class LogsErroAdminComponent implements OnInit {
  private api = inject(AdminApiService);

  resumo: ResumoLogsErro | null = null;
  pagina: PaginaLogsErro | null = null;
  carregando = false;
  selecionado: LogErroAdmin | null = null;

  categorias = Object.keys(ROTULOS_CATEGORIA);
  filtroCategoria = '';
  filtroTexto = '';
  filtroDe = '';
  filtroAte = '';

  ngOnInit(): void {
    this.carregarResumo();
    this.irParaPagina(1);
  }

  rotuloCategoria(categoria: string): string {
    return ROTULOS_CATEGORIA[categoria] ?? categoria;
  }

  carregarResumo(): void {
    this.api.obterComQuery<ResumoLogsErro>('logs-erro/resumo', '').subscribe((resumo) => (this.resumo = resumo));
  }

  aplicarFiltros(): void {
    this.irParaPagina(1);
  }

  limparFiltros(): void {
    this.filtroCategoria = '';
    this.filtroTexto = '';
    this.filtroDe = '';
    this.filtroAte = '';
    this.irParaPagina(1);
  }

  irParaPagina(numero: number): void {
    if (this.carregando) return;
    this.carregando = true;

    const params = new URLSearchParams();
    params.set('pagina', String(numero));
    params.set('tamanho', String(TAMANHO_PAGINA));
    if (this.filtroCategoria) params.set('categoria', this.filtroCategoria);
    if (this.filtroTexto.trim()) params.set('texto', this.filtroTexto.trim());
    if (this.filtroDe) params.set('de', this.filtroDe);
    if (this.filtroAte) params.set('ate', this.filtroAte);

    this.api.obterComQuery<PaginaLogsErro>('logs-erro', params.toString()).subscribe({
      next: (pagina) => {
        this.pagina = pagina;
        this.carregando = false;
      },
      error: () => (this.carregando = false),
    });
  }

  get paginasVisiveis(): number[] {
    if (!this.pagina) return [];
    const total = this.pagina.totalPaginas;
    const atual = this.pagina.paginaAtual;
    const numeros = new Set([1, total, atual - 1, atual, atual + 1].filter((n) => n >= 1 && n <= total));
    const ordenados = [...numeros].sort((a, b) => a - b);

    const resultado: number[] = [];
    ordenados.forEach((n, i) => {
      if (i > 0 && n - ordenados[i - 1] > 1) resultado.push(0);
      resultado.push(n);
    });
    return resultado;
  }

  abrir(log: LogErroAdmin): void {
    this.selecionado = log;
  }

  fechar(): void {
    this.selecionado = null;
  }

  formatarData(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });
  }
}
