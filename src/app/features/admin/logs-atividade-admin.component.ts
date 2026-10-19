import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EquipeService, FiltroLogs, LogAtividade, LogsFiltros } from '../../core/services/equipe.service';

interface CampoAlterado {
  c: string;
  d: string;
  p: string;
}

const ACOES = ['Criou', 'Alterou', 'Excluiu', 'Ocultou', 'Reexibiu', 'Aprovou', 'Rejeitou', 'Entrou', 'Segurança', 'Desativou'];

@Component({
  selector: 'app-logs-atividade-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './logs-atividade-admin.component.html',
  styleUrl: './logs-atividade-admin.component.scss',
})
export class LogsAtividadeAdminComponent implements OnInit {
  private equipe = inject(EquipeService);

  readonly acoes = ACOES;
  readonly tamanho = 40;

  filtros: LogsFiltros = { entidades: [], usuarios: [] };
  itens: LogAtividade[] = [];
  total = 0;
  pagina = 1;
  carregando = true;
  erro: string | null = null;
  aberto: number | null = null;

  usuarioId = '';
  entidade = '';
  acao = '';
  busca = '';
  de = '';
  ate = '';

  ngOnInit(): void {
    this.equipe.filtrosLogs().subscribe({ next: (f) => (this.filtros = f), error: () => undefined });
    this.consultar();
  }

  get totalPaginas(): number {
    return Math.max(1, Math.ceil(this.total / this.tamanho));
  }

  get temFiltro(): boolean {
    return !!(this.usuarioId || this.entidade || this.acao || this.busca || this.de || this.ate);
  }

  filtrar(): void {
    this.pagina = 1;
    this.consultar();
  }

  limpar(): void {
    this.usuarioId = this.entidade = this.acao = this.busca = this.de = this.ate = '';
    this.filtrar();
  }

  irPara(pagina: number): void {
    if (pagina < 1 || pagina > this.totalPaginas || pagina === this.pagina) return;
    this.pagina = pagina;
    this.consultar();
  }

  private consultar(): void {
    this.carregando = true;
    this.erro = null;
    const filtro: FiltroLogs = {
      usuarioId: this.usuarioId,
      entidade: this.entidade,
      acao: this.acao,
      busca: this.busca.trim(),
      // As datas do campo são do dia local: início do dia de e fim do dia ate, enviados em UTC.
      de: this.de ? new Date(`${this.de}T00:00:00`).toISOString() : '',
      ate: this.ate ? new Date(new Date(`${this.ate}T00:00:00`).getTime() + 86_400_000).toISOString() : '',
      pagina: this.pagina,
      tamanho: this.tamanho,
    };
    this.equipe.listarLogs(filtro).subscribe({
      next: (r) => {
        this.itens = r.itens;
        this.total = r.total;
        this.carregando = false;
        this.aberto = null;
      },
      error: () => {
        this.erro = 'Não foi possível carregar o histórico. Se a tabela de histórico ainda não foi criada no banco, rode o script 039.';
        this.carregando = false;
      },
    });
  }

  alternar(item: LogAtividade): void {
    if (!this.temDetalhes(item)) return;
    this.aberto = this.aberto === item.id ? null : item.id;
  }

  temDetalhes(item: LogAtividade): boolean {
    return !!item.alteracoesJson || !!item.ip;
  }

  campos(item: LogAtividade): CampoAlterado[] {
    if (!item.alteracoesJson) return [];
    try {
      return JSON.parse(item.alteracoesJson) as CampoAlterado[];
    } catch {
      return [];
    }
  }

  classeAcao(acao: string): string {
    switch (acao) {
      case 'Criou':
        return 'ok';
      case 'Excluiu':
      case 'Rejeitou':
      case 'Desativou':
        return 'perigo';
      case 'Ocultou':
      case 'Reexibiu':
        return 'aviso';
      case 'Entrou':
      case 'Segurança':
        return 'neutro';
      default:
        return 'info';
    }
  }
}
