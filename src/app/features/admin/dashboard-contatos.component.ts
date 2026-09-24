import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AdminApiService } from '../../core/services/admin-api.service';
import { DialogFocoDirective } from '../../shared/directives/dialog-foco.directive';
import { RelatorioContatosComponent } from './relatorio-contatos.component';

Chart.register(...registerables);

interface PontoSerie {
  rotulo: string;
  total: number;
}

export interface ContatoLista {
  id: number;
  nomeCompleto: string;
  email: string;
  telefone: string;
  especialidade: string;
  origem: string;
  tipoInteresse: string;
  estado: string;
  cidade: string;
  campanha: string;
  mensagem?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  criadoEm: string;
}

interface PaginaContatos {
  itens: ContatoLista[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

const TAMANHO_PAGINA = 10;

interface DashboardContatos {
  total: number;
  hoje: number;
  ontem: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  porDia: PontoSerie[];
  porEspecialidade: PontoSerie[];
  porOrigem: PontoSerie[];
  porEstado: PontoSerie[];
  porTipoInteresse: PontoSerie[];
  porCampanha: PontoSerie[];
  recentes: ContatoLista[];
}

const COR_PRINCIPAL = '#6b3fd4';
const PALETA = ['#6b3fd4', '#f5a623', '#2fa88a', '#e0559b', '#3b82c4', '#8d6e63', '#7cb342', '#ef6c00', '#26a69a', '#7e57c2'];

@Component({
  selector: 'app-dashboard-contatos',
  standalone: true,
  imports: [DialogFocoDirective, CommonModule, RelatorioContatosComponent],
  templateUrl: './dashboard-contatos.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class DashboardContatosComponent implements AfterViewInit, OnDestroy {
  private api = inject(AdminApiService);

  @ViewChild('graficoDia') graficoDia?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoEspecialidade') graficoEspecialidade?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoOrigem') graficoOrigem?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoTipo') graficoTipo?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoEstado') graficoEstado?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoCampanha') graficoCampanha?: ElementRef<HTMLCanvasElement>;

  dados: DashboardContatos | null = null;
  pagina: PaginaContatos | null = null;
  carregandoPagina = false;
  selecionado: ContatoLista | null = null;
  copiado: 'email' | 'telefone' | null = null;

  private timerCopiado: ReturnType<typeof setTimeout> | null = null;
  carregando = true;
  erro: string | null = null;

  private graficos: Chart[] = [];

  ngAfterViewInit(): void {
    this.irParaPagina(1);
    this.api.obterSingleton<DashboardContatos>('dashboard-contatos').subscribe({
      next: (dados) => {
        this.dados = dados;
        this.carregando = false;
        setTimeout(() => this.desenharGraficos(), 0);
      },
      error: () => {
        this.erro = 'Não foi possível carregar o dashboard.';
        this.carregando = false;
      },
    });
  }

  ngOnDestroy(): void {
    if (this.timerCopiado) clearTimeout(this.timerCopiado);
    this.graficos.forEach((g) => g.destroy());
  }

  get variacaoHoje(): number | null {
    if (!this.dados || this.dados.ontem === 0) return null;
    return Math.round(((this.dados.hoje - this.dados.ontem) / this.dados.ontem) * 100);
  }

  get mediaDiaria30(): string {
    return this.dados ? (this.dados.ultimos30Dias / 30).toFixed(1).replace('.', ',') : '0';
  }

  irParaPagina(numero: number): void {
    if (this.carregandoPagina) return;
    this.carregandoPagina = true;
    this.api.obterComQuery<PaginaContatos>('dashboard-contatos/paginado', `pagina=${numero}&tamanho=${TAMANHO_PAGINA}`).subscribe({
      next: (pagina) => {
        this.pagina = pagina;
        this.carregandoPagina = false;
      },
      error: () => (this.carregandoPagina = false),
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

  abrir(lead: ContatoLista): void {
    this.selecionado = lead;
  }

  fechar(): void {
    this.selecionado = null;
    this.copiado = null;
  }

  async copiar(texto: string, campo: 'email' | 'telefone'): Promise<void> {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }

    this.copiado = campo;
    if (this.timerCopiado) clearTimeout(this.timerCopiado);
    this.timerCopiado = setTimeout(() => (this.copiado = null), 1800);
  }

  formatarTelefone(digitos: string): string {
    return digitos.length === 11
      ? `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
      : `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  formatarDataCompleta(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  }

  formatarData(iso: string): string {
    return new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  }

  private desenharGraficos(): void {
    const dados = this.dados;
    if (!dados) return;

    const fonte = { family: 'Inter, sans-serif', size: 11 };
    const legenda = { position: 'bottom' as const, labels: { font: fonte, boxWidth: 12 } };
    const eixoY = { beginAtZero: true, ticks: { precision: 0, font: fonte }, grid: { color: '#eee9f8' } };
    const eixoX = { grid: { display: false }, ticks: { font: fonte } };

    const barras = (canvas: ElementRef<HTMLCanvasElement> | undefined, pontos: PontoSerie[], cor: string, horizontal: boolean) => {
      if (!canvas) return;
      this.graficos.push(
        new Chart(canvas.nativeElement, {
          type: 'bar',
          data: {
            labels: pontos.map((p) => p.rotulo),
            datasets: [{ label: 'Leads', data: pontos.map((p) => p.total), backgroundColor: cor, borderRadius: 4 }],
          },
          options: {
            indexAxis: horizontal ? 'y' : 'x',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: horizontal ? { x: eixoY, y: { grid: { display: false }, ticks: { font: fonte } } } : { x: eixoX, y: eixoY },
          },
        }),
      );
    };

    const rosca = (canvas: ElementRef<HTMLCanvasElement> | undefined, pontos: PontoSerie[]) => {
      if (!canvas) return;
      this.graficos.push(
        new Chart(canvas.nativeElement, {
          type: 'doughnut',
          data: {
            labels: pontos.map((p) => p.rotulo),
            datasets: [{ data: pontos.map((p) => p.total), backgroundColor: PALETA, borderWidth: 2, borderColor: '#fff' }],
          },
          options: { responsive: true, maintainAspectRatio: false, cutout: '60%', plugins: { legend: legenda } },
        }),
      );
    };

    if (this.graficoDia) {
      const acumulado: number[] = [];
      dados.porDia.reduce((soma, p) => {
        acumulado.push(soma + p.total);
        return soma + p.total;
      }, 0);

      this.graficos.push(
        new Chart(this.graficoDia.nativeElement, {
          type: 'bar',
          data: {
            labels: dados.porDia.map((p) => p.rotulo.slice(8, 10) + '/' + p.rotulo.slice(5, 7)),
            datasets: [
              { type: 'bar', label: 'Leads no dia', data: dados.porDia.map((p) => p.total), backgroundColor: COR_PRINCIPAL, borderRadius: 4, yAxisID: 'y' },
              { type: 'line', label: 'Acumulado (30 dias)', data: acumulado, borderColor: '#f5a623', backgroundColor: '#f5a623', tension: 0.3, pointRadius: 2, yAxisID: 'y1' },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: legenda },
            scales: { x: eixoX, y: eixoY, y1: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { precision: 0, font: fonte } } },
          },
        }),
      );
    }

    barras(this.graficoEspecialidade, dados.porEspecialidade, '#2fa88a', true);
    rosca(this.graficoOrigem, dados.porOrigem);
    rosca(this.graficoTipo, dados.porTipoInteresse);
    barras(this.graficoEstado, dados.porEstado, '#3b82c4', false);
    barras(this.graficoCampanha, dados.porCampanha, '#e0559b', true);
  }
}
