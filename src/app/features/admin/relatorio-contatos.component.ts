import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ESTADOS_BR } from '../../core/data/estados-br';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { Celula, DocumentoRelatorio, exportarCsv, exportarPdf, exportarXlsx } from './export.util';

interface Opcao {
  id: number;
  nome: string;
}

interface Contato {
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
  criadoEm: string;
}

type Formato = 'pdf' | 'csv' | 'xlsx';
type Tipo = 'relatorio' | 'contatos';

const FUSO_MS = -3 * 3600 * 1000;

@Component({
  selector: 'app-relatorio-contatos',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  templateUrl: './relatorio-contatos.component.html',
  styleUrl: './relatorio-newsletter.component.scss',
})
export class RelatorioContatosComponent implements OnInit {
  private api = inject(AdminApiService);

  estados = ESTADOS_BR;
  especialidades: Opcao[] = [];
  origens: Opcao[] = [];
  tipos: Opcao[] = [];
  campanhas: Opcao[] = [];

  de = '';
  ate = '';
  especialidadeId = '';
  origemId = '';
  tipoInteresseId = '';
  campanhaId = '';
  estado = '';

  gerando: string | null = null;
  mensagem: string | null = null;
  erro: string | null = null;

  ngOnInit(): void {
    this.api.listar<Opcao>('especialidades').subscribe((o) => (this.especialidades = o));
    this.api.listar<Opcao>('origens-lead').subscribe((o) => (this.origens = o));
    this.api.listar<Opcao>('tipos-interesse').subscribe((o) => (this.tipos = o));
    this.api.listar<Opcao>('campanhas').subscribe((o) => (this.campanhas = o));
  }

  get periodoInvalido(): boolean {
    return !!this.de && !!this.ate && this.de > this.ate;
  }

  limpar(): void {
    this.de = this.ate = this.especialidadeId = this.origemId = this.tipoInteresseId = this.campanhaId = this.estado = '';
    this.mensagem = null;
    this.erro = null;
  }

  async gerar(tipo: Tipo, formato: Formato): Promise<void> {
    if (this.gerando || this.periodoInvalido) return;

    this.gerando = `${tipo}-${formato}`;
    this.mensagem = null;
    this.erro = null;

    try {
      const contatos = await this.buscar();
      if (!contatos.length) {
        this.erro = 'Nenhum lead encontrado com esses filtros.';
        return;
      }

      const doc = tipo === 'contatos' ? this.montarLista(contatos) : this.montarRelatorio(contatos);
      if (formato === 'csv') exportarCsv(doc);
      else if (formato === 'xlsx') await exportarXlsx(doc);
      else await exportarPdf(doc);

      this.mensagem = `Arquivo gerado com ${contatos.length} lead${contatos.length === 1 ? '' : 's'}.`;
    } catch {
      this.erro = 'Não foi possível gerar o arquivo. Tente novamente.';
    } finally {
      this.gerando = null;
    }
  }

  private buscar(): Promise<Contato[]> {
    const params = new URLSearchParams();
    if (this.de) params.set('de', this.de);
    if (this.ate) params.set('ate', this.ate);
    if (this.especialidadeId) params.set('especialidadeId', this.especialidadeId);
    if (this.origemId) params.set('origemId', this.origemId);
    if (this.tipoInteresseId) params.set('tipoInteresseId', this.tipoInteresseId);
    if (this.campanhaId) params.set('campanhaId', this.campanhaId);
    if (this.estado) params.set('estado', this.estado);

    return new Promise((resolve, reject) =>
      this.api.listarComQuery<Contato>('dashboard-contatos/lista', params.toString()).subscribe({ next: resolve, error: reject }),
    );
  }

  private nomeDe(lista: Opcao[], id: string): string {
    return id ? (lista.find((o) => String(o.id) === id)?.nome ?? '-') : 'todas';
  }

  private filtrosTexto(): string[] {
    return [
      `Período: ${this.de ? this.formatarDia(this.de) : 'desde o início'} a ${this.ate ? this.formatarDia(this.ate) : 'hoje'}`,
      `Especialidade: ${this.nomeDe(this.especialidades, this.especialidadeId)} | Origem: ${this.nomeDe(this.origens, this.origemId)} | Interesse: ${this.nomeDe(this.tipos, this.tipoInteresseId)}`,
      `Estado: ${this.estado || 'todos'} | Campanha: ${this.nomeDe(this.campanhas, this.campanhaId)}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    ];
  }

  private nomeArquivo(prefixo: string): string {
    return `${prefixo}-${new Date().toISOString().slice(0, 10)}`;
  }

  private formatarTelefone(digitos: string): string {
    return digitos.length === 11
      ? `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
      : `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }

  private montarLista(contatos: Contato[]): DocumentoRelatorio {
    return {
      arquivo: this.nomeArquivo('leads-contato'),
      titulo: 'Leads — cadastros de contato',
      filtros: this.filtrosTexto(),
      secoes: [
        {
          titulo: 'Leads',
          cabecalho: ['Nome completo', 'E-mail', 'Telefone', 'Especialidade', 'Estado', 'Cidade', 'Origem', 'Interesse', 'Campanha', 'Cadastro', 'Mensagem'],
          linhas: contatos.map((c) => [
            c.nomeCompleto,
            c.email,
            this.formatarTelefone(c.telefone),
            c.especialidade,
            c.estado,
            c.cidade,
            c.origem,
            c.tipoInteresse,
            c.campanha,
            new Date(c.criadoEm).toLocaleString('pt-BR'),
            c.mensagem ?? '',
          ]),
        },
      ],
    };
  }

  private contar(contatos: Contato[], chave: (c: Contato) => string, rotulo: string): { titulo: string; cabecalho: string[]; linhas: Celula[][] } {
    const mapa = new Map<string, number>();
    contatos.forEach((c) => mapa.set(chave(c), (mapa.get(chave(c)) ?? 0) + 1));
    return {
      titulo: `Por ${rotulo.toLowerCase()}`,
      cabecalho: [rotulo, 'Leads', '% do total'],
      linhas: [...mapa.entries()].sort((a, b) => b[1] - a[1]).map(([nome, qtd]) => [nome, qtd, `${Math.round((qtd / contatos.length) * 100)}%`]),
    };
  }

  private montarRelatorio(contatos: Contato[]): DocumentoRelatorio {
    const total = contatos.length;
    const diaLocal = (iso: string) => new Date(new Date(iso).getTime() + FUSO_MS).toISOString().slice(0, 10);

    const porDia = new Map<string, number>();
    contatos.forEach((c) => porDia.set(diaLocal(c.criadoEm), (porDia.get(diaLocal(c.criadoEm)) ?? 0) + 1));

    const datas = [...porDia.keys()].sort();
    const inicio = this.de || datas[0];
    const fim = this.ate || new Date(Date.now() + FUSO_MS).toISOString().slice(0, 10);

    const linhasDia: Celula[][] = [];
    let acumulado = 0;
    let melhorDia = { dia: '', total: 0 };
    for (let d = new Date(inicio + 'T00:00:00Z'), n = 0; d.toISOString().slice(0, 10) <= fim && n < 400; d.setUTCDate(d.getUTCDate() + 1), n++) {
      const chave = d.toISOString().slice(0, 10);
      const qtd = porDia.get(chave) ?? 0;
      acumulado += qtd;
      if (qtd > melhorDia.total) melhorDia = { dia: chave, total: qtd };
      linhasDia.push([this.formatarDia(chave), qtd, acumulado]);
    }

    const dias = linhasDia.length || 1;
    return {
      arquivo: this.nomeArquivo('relatorio-leads-contato'),
      titulo: 'Relatório de leads — cadastros de contato',
      filtros: this.filtrosTexto(),
      secoes: [
        {
          titulo: 'Resumo',
          cabecalho: ['Indicador', 'Valor'],
          linhas: [
            ['Total de leads no período', total],
            ['Média de leads por dia', (total / dias).toFixed(1).replace('.', ',')],
            ['Dia com mais leads', melhorDia.total ? `${this.formatarDia(melhorDia.dia)} (${melhorDia.total})` : '-'],
          ],
        },
        { titulo: 'Leads por dia', cabecalho: ['Data', 'Leads', 'Acumulado'], linhas: linhasDia },
        this.contar(contatos, (c) => c.especialidade, 'Especialidade'),
        this.contar(contatos, (c) => c.origem, 'Origem'),
        this.contar(contatos, (c) => c.tipoInteresse, 'Tipo de interesse'),
        this.contar(contatos, (c) => c.estado, 'Estado'),
        this.contar(contatos, (c) => c.campanha, 'Campanha'),
      ],
    };
  }

  private formatarDia(iso: string): string {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
}
