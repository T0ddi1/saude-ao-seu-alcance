import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { AdminApiService } from '../../core/services/admin-api.service';
import { RelatorioNewsletterComponent } from './relatorio-newsletter.component';
import { DialogFocoDirective } from '../../shared/directives/dialog-foco.directive';
import { DashboardContatosComponent } from './dashboard-contatos.component';

Chart.register(...registerables);

interface PontoSerie {
  rotulo: string;
  total: number;
}

interface InscritoRecente {
  email: string;
  criadoEm: string;
  todosInteresses: boolean;
  interesses: string[];
  origem?: string | null;
  nome?: string | null;
  telefone?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

interface EstadoDrill {
  estado: string;
  total: number;
  cidades: PontoSerie[];
}

interface PaginaInscritos {
  itens: InscritoRecente[];
  paginaAtual: number;
  totalPaginas: number;
  totalItens: number;
}

const TAMANHO_PAGINA = 10;

interface Dashboard {
  total: number;
  hoje: number;
  ontem: number;
  ultimos7Dias: number;
  ultimos30Dias: number;
  porDia: PontoSerie[];
  porInteresse: PontoSerie[];
  porDiaSemana: PontoSerie[];
  porEstado: EstadoDrill[];
  recentes: InscritoRecente[];
}

const COR_PRINCIPAL = '#6b3fd4';
const PALETA = ['#6b3fd4', '#f5a623', '#2fa88a', '#e0559b', '#3b82c4', '#8d6e63', '#7cb342', '#ef6c00'];
const TOP_ESTADOS = 6;

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [DialogFocoDirective, CommonModule, RelatorioNewsletterComponent, DashboardContatosComponent],
  templateUrl: './dashboard-admin.component.html',
  styleUrl: './dashboard-admin.component.scss',
})
export class DashboardAdminComponent implements AfterViewInit, OnDestroy {
  private api = inject(AdminApiService);

  @ViewChild('graficoDia') graficoDia?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoInteresse') graficoInteresse?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoSemana') graficoSemana?: ElementRef<HTMLCanvasElement>;
  @ViewChild('graficoCidade') graficoCidade?: ElementRef<HTMLCanvasElement>;

  aba: 'newsletter' | 'leads' = 'newsletter';
  dados: Dashboard | null = null;
  pagina: PaginaInscritos | null = null;
  carregandoPagina = false;
  selecionado: InscritoRecente | null = null;
  copiado = false;

  private timerCopiado: ReturnType<typeof setTimeout> | null = null;
  carregando = true;
  erro: string | null = null;

  estadoSelecionado: string | null = null;
  mostrarOutrosEstados = false;
  alturaGraficoEstado = 260;
  private estadoVeioDeOutros = false;

  private graficos: Chart[] = [];
  private graficoCidadeChart: Chart | null = null;

  ngAfterViewInit(): void {
    this.irParaPagina(1);
    this.api.obterSingleton<Dashboard>('dashboard').subscribe({
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
    this.graficoCidadeChart?.destroy();
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
    this.api.obterComQuery<PaginaInscritos>('dashboard/inscritos/paginado', `pagina=${numero}&tamanho=${TAMANHO_PAGINA}`).subscribe({
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

  abrir(inscrito: InscritoRecente): void {
    this.selecionado = inscrito;
  }

  fechar(): void {
    this.selecionado = null;
    this.copiado = false;
  }

  async copiar(texto: string): Promise<void> {
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

    this.copiado = true;
    if (this.timerCopiado) clearTimeout(this.timerCopiado);
    this.timerCopiado = setTimeout(() => (this.copiado = false), 1800);
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
    const opcoesEixos = {
      x: { grid: { display: false }, ticks: { font: fonte } },
      y: { beginAtZero: true, ticks: { precision: 0, font: fonte }, grid: { color: '#eee9f8' } },
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
              { type: 'bar', label: 'Inscritos no dia', data: dados.porDia.map((p) => p.total), backgroundColor: COR_PRINCIPAL, borderRadius: 4, yAxisID: 'y' },
              { type: 'line', label: 'Acumulado (30 dias)', data: acumulado, borderColor: '#f5a623', backgroundColor: '#f5a623', tension: 0.3, pointRadius: 2, yAxisID: 'y1' },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { position: 'bottom', labels: { font: fonte, boxWidth: 12 } } },
            scales: {
              x: opcoesEixos.x,
              y: opcoesEixos.y,
              y1: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { precision: 0, font: fonte } },
            },
          },
        }),
      );
    }

    if (this.graficoInteresse) {
      this.graficos.push(
        new Chart(this.graficoInteresse.nativeElement, {
          type: 'doughnut',
          data: {
            labels: dados.porInteresse.map((p) => p.rotulo),
            datasets: [{ data: dados.porInteresse.map((p) => p.total), backgroundColor: PALETA, borderWidth: 2, borderColor: '#fff' }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: { legend: { position: 'bottom', labels: { font: fonte, boxWidth: 12 } } },
          },
        }),
      );
    }

    if (this.graficoSemana) {
      this.graficos.push(
        new Chart(this.graficoSemana.nativeElement, {
          type: 'bar',
          data: {
            labels: dados.porDiaSemana.map((p) => p.rotulo),
            datasets: [{ label: 'Inscrições', data: dados.porDiaSemana.map((p) => p.total), backgroundColor: '#2fa88a', borderRadius: 4 }],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: opcoesEixos,
          },
        }),
      );
    }

    this.renderGraficoEstado();
  }

  voltarEstados(): void {
    if (this.estadoSelecionado && this.estadoVeioDeOutros) {
      this.estadoSelecionado = null;
    } else {
      this.estadoSelecionado = null;
      this.mostrarOutrosEstados = false;
    }
    this.renderGraficoEstado();
  }

  private separarEstados(dados: Dashboard): { principais: EstadoDrill[]; outros: EstadoDrill[] } {
    return {
      principais: dados.porEstado.slice(0, TOP_ESTADOS),
      outros: dados.porEstado.slice(TOP_ESTADOS),
    };
  }

  private renderGraficoEstado(): void {
    const dados = this.dados;
    if (!dados || !this.graficoCidade) return;

    const fonte = { family: 'Inter, sans-serif', size: 11 };
    const estado = this.estadoSelecionado ? dados.porEstado.find((e) => e.estado === this.estadoSelecionado) : null;
    const { principais, outros } = this.separarEstados(dados);

    let labels: string[];
    let valores: number[];
    let cor: string;

    if (estado) {
      labels = estado.cidades.map((c) => c.rotulo);
      valores = estado.cidades.map((c) => c.total);
      cor = '#3b82c4';
    } else if (this.mostrarOutrosEstados) {
      labels = outros.map((e) => e.estado);
      valores = outros.map((e) => e.total);
      cor = '#f5a623';
    } else {
      labels = principais.map((e) => e.estado);
      valores = principais.map((e) => e.total);
      if (outros.length) {
        labels = [...labels, `Outros (${outros.length})`];
        valores = [...valores, outros.reduce((soma, e) => soma + e.total, 0)];
      }
      cor = '#e0559b';
    }

    this.alturaGraficoEstado = Math.max(260, labels.length * 34 + 40);
    const container = this.graficoCidade.nativeElement.parentElement;
    if (container) container.style.height = `${this.alturaGraficoEstado}px`;

    if (this.graficoCidadeChart) {
      this.graficoCidadeChart.data.labels = labels;
      this.graficoCidadeChart.data.datasets[0].data = valores;
      (this.graficoCidadeChart.data.datasets[0] as { backgroundColor: string }).backgroundColor = cor;
      this.graficoCidadeChart.resize();
      this.graficoCidadeChart.update();
      return;
    }

    this.graficoCidadeChart = new Chart(this.graficoCidade.nativeElement, {
      type: 'bar',
      data: {
        labels,
        datasets: [{ label: 'Inscrições', data: valores, backgroundColor: cor, borderRadius: 4 }],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (_evento, elementos) => {
          if (this.estadoSelecionado || !elementos.length) return;
          const indice = elementos[0].index;
          const dadosAtuais = this.dados;
          if (!dadosAtuais) return;
          const { principais: principaisAtuais, outros: outrosAtuais } = this.separarEstados(dadosAtuais);

          if (this.mostrarOutrosEstados) {
            const estadoClicado = outrosAtuais[indice];
            if (!estadoClicado || !estadoClicado.cidades.length) return;
            this.estadoSelecionado = estadoClicado.estado;
            this.estadoVeioDeOutros = true;
            this.renderGraficoEstado();
            return;
          }

          if (indice < principaisAtuais.length) {
            const estadoClicado = principaisAtuais[indice];
            if (!estadoClicado.cidades.length) return;
            this.estadoSelecionado = estadoClicado.estado;
            this.estadoVeioDeOutros = false;
            this.renderGraficoEstado();
          } else if (outrosAtuais.length) {
            this.mostrarOutrosEstados = true;
            this.renderGraficoEstado();
          }
        },
        onHover: (evento, elementos) => {
          const alvo = evento.native?.target as HTMLElement | undefined;
          if (alvo) alvo.style.cursor = !this.estadoSelecionado && elementos.length ? 'pointer' : 'default';
        },
        plugins: { legend: { display: false } },
        scales: {
          x: { beginAtZero: true, ticks: { precision: 0, font: fonte }, grid: { color: '#eee9f8' } },
          y: { grid: { display: false }, ticks: { font: fonte } },
        },
      },
    });
  }
}
