import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { CategoriaAdmin } from '../../core/models/admin.model';
import { DatePickerComponent } from '../../shared/components/date-picker/date-picker.component';
import { DocumentoRelatorio, exportarCsv, exportarPdf, exportarXlsx } from './export.util';

interface Inscrito {
  email: string;
  criadoEm: string;
  todosInteresses: boolean;
  interesses: string[];
  origem?: string | null;
}

type Formato = 'pdf' | 'csv' | 'xlsx';
type Tipo = 'relatorio' | 'inscritos';

const FUSO_MS = -3 * 3600 * 1000;

@Component({
  selector: 'app-relatorio-newsletter',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePickerComponent],
  templateUrl: './relatorio-newsletter.component.html',
  styleUrl: './relatorio-newsletter.component.scss',
})
export class RelatorioNewsletterComponent implements OnInit {
  private api = inject(AdminApiService);

  categorias: CategoriaAdmin[] = [];
  de = '';
  ate = '';
  topico = '';
  gerando: string | null = null;
  mensagem: string | null = null;
  erro: string | null = null;

  ngOnInit(): void {
    this.api.listar<CategoriaAdmin>('categorias').subscribe((c) => (this.categorias = c));
  }

  get periodoInvalido(): boolean {
    return !!this.de && !!this.ate && this.de > this.ate;
  }

  limpar(): void {
    this.de = '';
    this.ate = '';
    this.topico = '';
    this.mensagem = null;
    this.erro = null;
  }

  async gerar(tipo: Tipo, formato: Formato): Promise<void> {
    if (this.gerando || this.periodoInvalido) return;

    this.gerando = `${tipo}-${formato}`;
    this.mensagem = null;
    this.erro = null;

    try {
      const inscritos = await this.buscarInscritos();
      if (!inscritos.length) {
        this.erro = 'Nenhum inscrito encontrado com esses filtros.';
        return;
      }

      const doc = tipo === 'inscritos' ? this.montarListaInscritos(inscritos) : this.montarRelatorio(inscritos);
      if (formato === 'csv') exportarCsv(doc);
      else if (formato === 'xlsx') await exportarXlsx(doc);
      else await exportarPdf(doc);

      this.mensagem = `Arquivo gerado com ${inscritos.length} inscrito${inscritos.length === 1 ? '' : 's'}.`;
    } catch {
      this.erro = 'Não foi possível gerar o arquivo. Tente novamente.';
    } finally {
      this.gerando = null;
    }
  }

  private buscarInscritos(): Promise<Inscrito[]> {
    const params = new URLSearchParams();
    if (this.de) params.set('de', this.de);
    if (this.ate) params.set('ate', this.ate);
    if (this.topico) params.set('topico', this.topico);

    return new Promise((resolve, reject) =>
      this.api.listarComQuery<Inscrito>('dashboard/inscritos', params.toString()).subscribe({ next: resolve, error: reject }),
    );
  }

  private filtrosTexto(): string[] {
    const nomeTopico = this.categorias.find((c) => c.slug === this.topico)?.nome;
    return [
      `Período: ${this.de ? this.formatarDia(this.de) : 'desde o início'} a ${this.ate ? this.formatarDia(this.ate) : 'hoje'}`,
      `Assunto: ${nomeTopico ?? 'todos'}${this.topico ? ' (inclui inscritos que escolheram "Todos")' : ''}`,
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
    ];
  }

  private nomeArquivo(prefixo: string): string {
    const hoje = new Date().toISOString().slice(0, 10);
    return `${prefixo}-${hoje}`;
  }

  private montarListaInscritos(inscritos: Inscrito[]): DocumentoRelatorio {
    return {
      arquivo: this.nomeArquivo('inscritos-newsletter'),
      titulo: 'Inscritos na newsletter',
      filtros: this.filtrosTexto(),
      secoes: [
        {
          titulo: 'Inscritos',
          cabecalho: ['E-mail', 'Assuntos', 'Origem', 'Inscrição'],
          linhas: inscritos.map((i) => [
            i.email,
            i.todosInteresses ? 'Todos' : i.interesses.join(', '),
            i.origem ?? '',
            new Date(i.criadoEm).toLocaleString('pt-BR'),
          ]),
        },
      ],
    };
  }

  private montarRelatorio(inscritos: Inscrito[]): DocumentoRelatorio {
    const total = inscritos.length;
    const diaLocal = (iso: string) => new Date(new Date(iso).getTime() + FUSO_MS).toISOString().slice(0, 10);

    const porDia = new Map<string, number>();
    inscritos.forEach((i) => porDia.set(diaLocal(i.criadoEm), (porDia.get(diaLocal(i.criadoEm)) ?? 0) + 1));

    const datas = [...porDia.keys()].sort();
    const inicio = this.de || datas[0];
    const fim = this.ate || new Date(Date.now() + FUSO_MS).toISOString().slice(0, 10);

    const linhasDia: (string | number)[][] = [];
    let acumulado = 0;
    let melhorDia = { dia: '', total: 0 };
    for (let d = new Date(inicio + 'T00:00:00Z'), n = 0; d.toISOString().slice(0, 10) <= fim && n < 400; d.setUTCDate(d.getUTCDate() + 1), n++) {
      const chave = d.toISOString().slice(0, 10);
      const qtd = porDia.get(chave) ?? 0;
      acumulado += qtd;
      if (qtd > melhorDia.total) melhorDia = { dia: chave, total: qtd };
      linhasDia.push([this.formatarDia(chave), qtd, acumulado]);
    }

    const porAssunto = new Map<string, number>();
    inscritos.forEach((i) => {
      const chaves = i.todosInteresses ? ['Todos os assuntos'] : i.interesses;
      chaves.forEach((c) => porAssunto.set(c, (porAssunto.get(c) ?? 0) + 1));
    });
    const linhasAssunto = [...porAssunto.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([nome, qtd]) => [nome, qtd, `${Math.round((qtd / total) * 100)}%`]);

    const dias = linhasDia.length || 1;
    return {
      arquivo: this.nomeArquivo('relatorio-newsletter'),
      titulo: 'Relatório de inscrições na newsletter',
      filtros: this.filtrosTexto(),
      secoes: [
        {
          titulo: 'Resumo',
          cabecalho: ['Indicador', 'Valor'],
          linhas: [
            ['Total de inscritos no período', total],
            ['Média de inscrições por dia', (total / dias).toFixed(1).replace('.', ',')],
            ['Dia com mais inscrições', melhorDia.total ? `${this.formatarDia(melhorDia.dia)} (${melhorDia.total})` : '-'],
          ],
        },
        { titulo: 'Inscrições por dia', cabecalho: ['Data', 'Inscritos', 'Acumulado'], linhas: linhasDia },
        { titulo: 'Por assunto de interesse', cabecalho: ['Assunto', 'Inscritos', '% dos inscritos'], linhas: linhasAssunto },
      ],
    };
  }

  private formatarDia(iso: string): string {
    const [a, m, d] = iso.split('-');
    return `${d}/${m}/${a}`;
  }
}
