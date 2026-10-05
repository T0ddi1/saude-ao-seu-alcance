import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { QuillEditorComponent } from '../../shared/components/quill-editor/quill-editor.component';
import { IconPickerComponent } from '../../shared/components/icon-picker/icon-picker.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card.component';
import { ArticleCardComponent } from '../blog/components/article-card/article-card.component';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ArtigoAdmin } from '../../core/models/admin.model';
import { ContentCard, IconGlyph } from '../../core/models/home.model';
import { BlogArticle } from '../../core/models/blog.model';

interface CategoriaAdmin {
  id: number;
  nome: string;
  slug: string;
  resumo: string | null;
  icone: string | null;
  ehSecaoObservatorio: boolean;
  ativo: boolean;
}

type TipoBloco = 'Texto' | 'GradeArtigos' | 'Indicadores' | 'CardsSecoes';
type ModoGrade = 'Manual' | 'RecentesAuto' | 'MaisVistosAuto' | 'MaisSalvosAuto';

interface BlocoAdmin {
  id: number;
  categoriaId: number | null;
  tipo: TipoBloco;
  titulo: string | null;
  conteudoHtml: string | null;
  limiteItens: number;
  ordem: number;
  modo: ModoGrade;
  categoriaFiltroId: number | null;
  configuracaoJson: string | null;
  ativo: boolean;
}

interface IndicadorAdmin {
  id: number;
  categoriaId: number | null;
  rotulo: string;
  valor: string;
  complemento: string | null;
  ordem: number;
  indicadorIbgeConfigJson: string | null;
  ativo: boolean;
}

interface IbgeTabela {
  id: number;
  nome: string;
  pesquisa: string;
}

interface IbgeVariavel {
  id: number;
  nome: string;
  unidade: string;
}

interface IbgeCategoria {
  id: number;
  nome: string;
}

interface IbgeClassificacao {
  id: number;
  nome: string;
  categorias: IbgeCategoria[];
}

interface IbgeMetadados {
  id: number;
  nome: string;
  variaveis: IbgeVariavel[];
  classificacoes: IbgeClassificacao[];
}

interface OpcaoTipoBloco {
  tipo: TipoBloco;
  icone: string;
  rotulo: string;
  descricaoSecao: string;
  descricaoHub: string;
}

interface PreviewArtigo {
  title: string;
  slug: string;
  excerpt: string;
  image: string | null;
  categorySlug: string;
  publishedAt: string | null;
}

interface PreviewIndicador {
  rotulo: string;
  valor: string;
  complemento: string | null;
}

interface PreviewSecao {
  nome: string;
  slug: string;
  resumo: string | null;
  icone: string | null;
}

interface PreviewBloco {
  tipo: TipoBloco;
  titulo: string | null;
  conteudoHtml?: string;
  artigos?: PreviewArtigo[];
  indicadores?: PreviewIndicador[];
  secoes?: PreviewSecao[];
}

const OPCOES_TIPO_BLOCO: OpcaoTipoBloco[] = [
  {
    tipo: 'Texto',
    icone: 'fa-solid fa-align-left',
    rotulo: 'Texto',
    descricaoSecao: 'Um parágrafo (ou vários) para apresentar a seção ou destacar alguma informação.',
    descricaoHub: 'Um parágrafo (ou vários) de apresentação — é o que aparece antes dos cards das seções.',
  },
  {
    tipo: 'GradeArtigos',
    icone: 'fa-solid fa-table-cells',
    rotulo: 'Grade de artigos',
    descricaoSecao: 'Mostra artigos — escolhidos à mão ou automaticamente (mais recentes, mais vistos, mais salvos), de qualquer tópico.',
    descricaoHub: 'Mostra artigos — escolhidos à mão ou automaticamente (mais recentes, mais vistos, mais salvos), de qualquer tópico.',
  },
  {
    tipo: 'Indicadores',
    icone: 'fa-solid fa-chart-simple',
    rotulo: 'Indicadores',
    descricaoSecao: 'Números em destaque (tipo os da Home), só que cadastrados à parte, só para esta seção.',
    descricaoHub: 'Números em destaque (tipo os da Home), cadastrados à parte, só para a página de entrada.',
  },
  {
    tipo: 'CardsSecoes',
    icone: 'fa-solid fa-grip',
    rotulo: 'Cards das seções',
    descricaoSecao: 'A vitrine com as 5 seções — só faz sentido na página de entrada, não aqui.',
    descricaoHub: 'A vitrine com as 5 seções, cada uma virando um card clicável.',
  },
];

const ROTULOS_TIPO_BLOCO: Record<TipoBloco, string> = Object.fromEntries(
  OPCOES_TIPO_BLOCO.map((o) => [o.tipo, o.rotulo]),
) as Record<TipoBloco, string>;

const ROTULOS_MODO_GRADE: Record<ModoGrade, string> = {
  Manual: 'Manual — eu escolho os artigos',
  RecentesAuto: 'Automático — mais recentes',
  MaisVistosAuto: 'Automático — mais vistos',
  MaisSalvosAuto: 'Automático — mais salvos',
};

@Component({
  selector: 'app-observatorio-admin',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    QuillEditorComponent,
    IconPickerComponent,
    IconComponent,
    CategoryCardComponent,
    ArticleCardComponent,
  ],
  templateUrl: './observatorio-admin.component.html',
  styleUrl: './observatorio-admin.component.scss',
})
export class ObservatorioAdminComponent implements OnInit, OnDestroy, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);
  private destruido = new Subject<void>();

  readonly rotulosTipoBloco = ROTULOS_TIPO_BLOCO;
  readonly opcoesTipoBloco = OPCOES_TIPO_BLOCO;
  readonly rotulosModoGrade = ROTULOS_MODO_GRADE;
  readonly modosGrade: ModoGrade[] = ['RecentesAuto', 'MaisVistosAuto', 'MaisSalvosAuto', 'Manual'];

  carregando = true;
  erro: string | null = null;

  secoes: CategoriaAdmin[] = [];
  todasCategorias: CategoriaAdmin[] = [];
  artigos: ArtigoAdmin[] = [];

  /** 'hub' = página de entrada (/observatorio); um número = o Id da seção selecionada. */
  paginaAtual: 'hub' | number = 'hub';

  criandoNova = false;
  salvandoSecao = false;

  formSecao = this.fb.group({
    nome: [''],
    resumo: [''],
    icone: [''],
  });

  blocos: BlocoAdmin[] = [];
  indicadores: IndicadorAdmin[] = [];
  escolhendoTipoBloco = false;
  editandoBlocoId: number | null = null;
  criandoBloco = false;
  editandoIndicadorId: number | null = null;
  criandoIndicador = false;

  artigosSelecionados: ArtigoAdmin[] = [];
  preview: PreviewBloco | null = null;
  carregandoPreview = false;

  formBloco = this.fb.group({
    tipo: 'Texto' as TipoBloco,
    titulo: [''],
    conteudoHtml: [''],
    limiteItens: [4],
    modo: 'RecentesAuto' as ModoGrade,
    categoriaFiltroId: null as number | null,
  });

  formIndicador = this.fb.group({
    rotulo: [''],
    valor: [''],
    complemento: [''],
  });

  // ---- Vínculo com dado real do IBGE (opcional, dentro do formulário de indicador) ----
  usandoIbge = false;
  buscaTabelaIbge = '';
  private buscaTabelaIbge$ = new Subject<string>();
  buscandoTabelasIbge = false;
  tabelasIbge: IbgeTabela[] = [];
  tabelaIbgeSelecionada: IbgeTabela | null = null;
  metadadosIbge: IbgeMetadados | null = null;
  variavelIbgeId: number | null = null;
  classificacaoAnoId: number | null = null;
  categoriaPorClassificacao: Record<number, number | null> = {};
  casasDecimaisIbge = 1;
  complementoModeloIbge = 'Fonte: IBGE, {ano}';
  buscandoValorIbge = false;
  previewIbge: { valor: string; complemento: string } | null = null;
  erroValorIbge: string | null = null;

  ngOnInit(): void {
    this.carregarSecoes();
    this.carregarBlocosEIndicadores();
    this.api.listar<CategoriaAdmin>('categorias').subscribe((cats) => (this.todasCategorias = cats));
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => (this.artigos = artigos));

    this.formBloco.valueChanges.pipe(debounceTime(400), takeUntil(this.destruido)).subscribe(() => this.atualizarPreview());

    this.buscaTabelaIbge$.pipe(debounceTime(400), takeUntil(this.destruido)).subscribe((busca) => this.executarBuscaTabelasIbge(busca));
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  get categoriaIdAtual(): number | null {
    return this.paginaAtual === 'hub' ? null : this.paginaAtual;
  }

  get secaoSelecionada(): CategoriaAdmin | null {
    return this.paginaAtual === 'hub' ? null : this.secoes.find((s) => s.id === this.paginaAtual) ?? null;
  }

  descricaoTipoBloco(opcao: OpcaoTipoBloco): string {
    return this.paginaAtual === 'hub' ? opcao.descricaoHub : opcao.descricaoSecao;
  }

  get opcoesTipoBlocoDisponiveis(): OpcaoTipoBloco[] {
    // "Cards das seções" só faz sentido na página de entrada.
    return this.paginaAtual === 'hub' ? this.opcoesTipoBloco : this.opcoesTipoBloco.filter((o) => o.tipo !== 'CardsSecoes');
  }

  opcaoDoTipo(tipo: TipoBloco | null | undefined): OpcaoTipoBloco | undefined {
    return this.opcoesTipoBloco.find((o) => o.tipo === tipo);
  }

  get artigosDisponiveis(): ArtigoAdmin[] {
    return this.artigos.filter((a) => !this.artigosSelecionados.some((s) => s.id === a.id));
  }

  private carregarSecoes(): void {
    this.carregando = true;
    this.api.listar<CategoriaAdmin>('categorias').subscribe({
      next: (categorias) => {
        this.secoes = categorias.filter((c) => c.ehSecaoObservatorio).sort((a, b) => a.nome.localeCompare(b.nome));
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar as seções do Observatório.';
        this.carregando = false;
      },
    });
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formSecao.dirty || this.formBloco.dirty || this.formIndicador.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  // ---- Navegação entre páginas (hub / seções) ----

  abrirHub(): void {
    this.paginaAtual = 'hub';
    this.criandoNova = false;
    this.fecharEdicaoBloco();
    this.fecharEdicaoIndicador();
    this.carregarBlocosEIndicadores();
  }

  abrirSecao(secao: CategoriaAdmin): void {
    this.paginaAtual = secao.id;
    this.criandoNova = false;
    this.formSecao.reset({ nome: secao.nome, resumo: secao.resumo ?? '', icone: secao.icone ?? '' });
    this.fecharEdicaoBloco();
    this.fecharEdicaoIndicador();
    this.carregarBlocosEIndicadores();
  }

  novaSecao(): void {
    this.criandoNova = true;
    this.paginaAtual = 'hub'; // até salvar, não há seção selecionável
    this.formSecao.reset({ nome: '', resumo: '', icone: '' });
    this.blocos = [];
    this.indicadores = [];
  }

  cancelarNovaSecao(): void {
    this.criandoNova = false;
    this.formSecao.markAsPristine();
    this.abrirHub();
  }

  salvarSecao(): void {
    if (!this.formSecao.value.nome?.trim()) return;

    this.salvandoSecao = true;
    const payload = {
      nome: this.formSecao.value.nome,
      resumo: this.formSecao.value.resumo || null,
      icone: this.formSecao.value.icone || null,
      ehSecaoObservatorio: true,
    };

    const idAtual = this.secaoSelecionada?.id;
    const requisicao = idAtual
      ? this.api.atualizar<CategoriaAdmin>('categorias', idAtual, payload)
      : this.api.criar<CategoriaAdmin>('categorias', payload);

    requisicao.subscribe({
      next: (secao) => {
        this.salvandoSecao = false;
        this.criandoNova = false;
        this.formSecao.markAsPristine();
        this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => {
          this.secoes = categorias.filter((c) => c.ehSecaoObservatorio).sort((a, b) => a.nome.localeCompare(b.nome));
          this.todasCategorias = categorias;
          this.paginaAtual = secao.id;
        });
      },
      error: () => {
        this.erro = 'Não foi possível salvar a seção.';
        this.salvandoSecao = false;
      },
    });
  }

  async excluirSecao(secao: CategoriaAdmin): Promise<void> {
    const ok = await this.swal.confirmarExclusao(`Excluir a seção "${secao.nome}"? Os artigos já publicados nela deixam de ter categoria.`);
    if (!ok) return;

    this.api.excluir('categorias', secao.id).subscribe(() => {
      if (this.paginaAtual === secao.id) this.abrirHub();
      this.carregarSecoes();
    });
  }

  // ---- Blocos e indicadores (da página atual: hub ou a seção selecionada) ----

  private carregarBlocosEIndicadores(): void {
    const query = this.categoriaIdAtual ? `categoriaId=${this.categoriaIdAtual}` : '';
    this.api.listarComQuery<BlocoAdmin>('blocos-observatorio', query).subscribe((blocos) => {
      this.blocos = blocos.sort((a, b) => a.ordem - b.ordem);
    });
    this.api.listarComQuery<IndicadorAdmin>('indicadores-observatorio', query).subscribe((indicadores) => {
      this.indicadores = indicadores.sort((a, b) => a.ordem - b.ordem);
    });
  }

  abrirEscolhaDeTipo(): void {
    this.escolhendoTipoBloco = true;
    this.criandoBloco = false;
    this.editandoBlocoId = null;
    this.preview = null;
  }

  escolherTipoBloco(tipo: TipoBloco): void {
    this.escolhendoTipoBloco = false;
    this.criandoBloco = true;
    this.editandoBlocoId = null;
    this.artigosSelecionados = [];
    this.formBloco.reset({ tipo, titulo: '', conteudoHtml: '', limiteItens: 4, modo: 'RecentesAuto', categoriaFiltroId: null });
  }

  editarBloco(bloco: BlocoAdmin): void {
    this.escolhendoTipoBloco = false;
    this.criandoBloco = false;
    this.editandoBlocoId = bloco.id;
    this.artigosSelecionados = this.extrairArtigosSelecionados(bloco.configuracaoJson);
    this.formBloco.reset({
      tipo: bloco.tipo,
      titulo: bloco.titulo ?? '',
      conteudoHtml: bloco.conteudoHtml ?? '',
      limiteItens: bloco.limiteItens || 4,
      modo: bloco.modo || 'RecentesAuto',
      categoriaFiltroId: bloco.categoriaFiltroId,
    });
  }

  fecharEdicaoBloco(): void {
    this.escolhendoTipoBloco = false;
    this.criandoBloco = false;
    this.editandoBlocoId = null;
    this.artigosSelecionados = [];
    this.preview = null;
    this.formBloco.markAsPristine();
    this.fecharEdicaoIndicador();
  }

  adicionarArtigoManual(idTexto: string): void {
    const id = Number(idTexto);
    if (!id) return;
    const artigo = this.artigos.find((a) => a.id === id);
    if (!artigo) return;
    this.artigosSelecionados = [...this.artigosSelecionados, artigo];
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  removerArtigoManual(artigo: ArtigoAdmin): void {
    this.artigosSelecionados = this.artigosSelecionados.filter((a) => a.id !== artigo.id);
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  soltarArtigoManual(event: CdkDragDrop<ArtigoAdmin[]>): void {
    const lista = [...this.artigosSelecionados];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.artigosSelecionados = lista;
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  private extrairArtigosSelecionados(configuracaoJson: string | null): ArtigoAdmin[] {
    if (!configuracaoJson) return [];
    try {
      const dados = JSON.parse(configuracaoJson) as { artigoIds?: number[] };
      const ids = dados.artigoIds ?? [];
      return ids.map((id) => this.artigos.find((a) => a.id === id)).filter((a): a is ArtigoAdmin => !!a);
    } catch {
      return [];
    }
  }

  private montarPayloadBloco(): Record<string, unknown> {
    const valor = this.formBloco.value;
    return {
      categoriaId: this.categoriaIdAtual,
      tipo: valor.tipo,
      titulo: valor.titulo || null,
      conteudoHtml: valor.conteudoHtml || null,
      limiteItens: valor.limiteItens || 4,
      modo: valor.modo,
      categoriaFiltroId: valor.categoriaFiltroId,
      configuracaoJson: valor.modo === 'Manual' ? JSON.stringify({ artigoIds: this.artigosSelecionados.map((a) => a.id) }) : null,
      ordem: this.editandoBlocoId ? this.blocos.find((b) => b.id === this.editandoBlocoId)?.ordem ?? 0 : this.blocos.length + 1,
    };
  }

  private atualizarPreview(): void {
    if (!this.criandoBloco && !this.editandoBlocoId) return;

    this.carregandoPreview = true;
    this.api.criar<PreviewBloco>('blocos-observatorio/preview', this.montarPayloadBloco()).subscribe({
      next: (resultado) => {
        this.preview = resultado;
        this.carregandoPreview = false;
      },
      error: () => {
        this.carregandoPreview = false;
      },
    });
  }

  salvarBloco(): void {
    const payload = this.montarPayloadBloco();

    const requisicao = this.editandoBlocoId
      ? this.api.atualizar<BlocoAdmin>('blocos-observatorio', this.editandoBlocoId, payload)
      : this.api.criar<BlocoAdmin>('blocos-observatorio', payload);

    requisicao.subscribe(() => {
      this.fecharEdicaoBloco();
      this.carregarBlocosEIndicadores();
    });
  }

  async excluirBloco(bloco: BlocoAdmin): Promise<void> {
    const ok = await this.swal.confirmarExclusao(`Excluir este bloco (${this.rotulosTipoBloco[bloco.tipo]})?`);
    if (!ok) return;

    this.api.excluir('blocos-observatorio', bloco.id).subscribe(() => this.carregarBlocosEIndicadores());
  }

  soltarBloco(event: CdkDragDrop<BlocoAdmin[]>): void {
    const lista = [...this.blocos];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.blocos = lista;

    lista.forEach((bloco, indice) => {
      const novaOrdem = indice + 1;
      if (bloco.ordem === novaOrdem) return;
      bloco.ordem = novaOrdem;
      this.api.atualizar('blocos-observatorio', bloco.id, { ...bloco }).subscribe();
    });
  }

  novoIndicador(): void {
    this.criandoIndicador = true;
    this.editandoIndicadorId = null;
    this.formIndicador.reset({ rotulo: '', valor: '', complemento: '' });
    this.resetarEstadoIbge();
  }

  editarIndicador(indicador: IndicadorAdmin): void {
    this.criandoIndicador = false;
    this.editandoIndicadorId = indicador.id;
    this.formIndicador.reset({ rotulo: indicador.rotulo, valor: indicador.valor, complemento: indicador.complemento ?? '' });
    this.resetarEstadoIbge();

    const definicao = this.parsearConfigIbge(indicador.indicadorIbgeConfigJson);
    if (!definicao) return;

    this.usandoIbge = true;
    this.casasDecimaisIbge = definicao.casasDecimais ?? 1;
    this.complementoModeloIbge = definicao.complementoModelo ?? 'Fonte: IBGE, {ano}';
    this.variavelIbgeId = definicao.variavel;
    this.classificacaoAnoId = definicao.classificacaoAno ?? null;
    this.categoriaPorClassificacao = { ...definicao.classificacoes };

    this.api.obterSingleton<IbgeMetadados>(`ibge/tabelas/${definicao.tabela}/metadados`).subscribe((metadados) => {
      this.metadadosIbge = metadados;
      this.tabelaIbgeSelecionada = { id: metadados.id, nome: metadados.nome, pesquisa: '' };
    });
  }

  fecharEdicaoIndicador(): void {
    this.criandoIndicador = false;
    this.editandoIndicadorId = null;
    this.formIndicador.markAsPristine();
    this.resetarEstadoIbge();
  }

  private resetarEstadoIbge(): void {
    this.usandoIbge = false;
    this.buscaTabelaIbge = '';
    this.tabelasIbge = [];
    this.tabelaIbgeSelecionada = null;
    this.metadadosIbge = null;
    this.variavelIbgeId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.casasDecimaisIbge = 1;
    this.complementoModeloIbge = 'Fonte: IBGE, {ano}';
    this.previewIbge = null;
    this.erroValorIbge = null;
  }

  truncarOpcaoIbge(texto: string, tamanhoMaximo = 90): string {
    return texto.length > tamanhoMaximo ? texto.slice(0, tamanhoMaximo).trimEnd() + '…' : texto;
  }

  digitarBuscaTabelaIbge(texto: string): void {
    this.buscaTabelaIbge = texto;
    this.buscaTabelaIbge$.next(texto);
  }

  private executarBuscaTabelasIbge(busca: string): void {
    this.buscandoTabelasIbge = true;
    this.api.listarComQuery<IbgeTabela>('ibge/tabelas', `busca=${encodeURIComponent(busca)}`).subscribe({
      next: (tabelas) => {
        this.tabelasIbge = tabelas;
        this.buscandoTabelasIbge = false;
      },
      error: () => (this.buscandoTabelasIbge = false),
    });
  }

  selecionarTabelaIbge(tabela: IbgeTabela): void {
    this.tabelaIbgeSelecionada = tabela;
    this.tabelasIbge = [];
    this.metadadosIbge = null;
    this.variavelIbgeId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.previewIbge = null;
    this.erroValorIbge = null;

    this.api.obterSingleton<IbgeMetadados>(`ibge/tabelas/${tabela.id}/metadados`).subscribe((metadados) => {
      this.metadadosIbge = metadados;
    });
  }

  trocarTabelaIbge(): void {
    this.tabelaIbgeSelecionada = null;
    this.metadadosIbge = null;
    this.variavelIbgeId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.previewIbge = null;
    this.erroValorIbge = null;
  }

  alternarClassificacaoAno(classificacaoId: number): void {
    this.classificacaoAnoId = this.classificacaoAnoId === classificacaoId ? null : classificacaoId;
    delete this.categoriaPorClassificacao[classificacaoId];
    this.previewIbge = null;
    this.erroValorIbge = null;
  }

  selecionarCategoriaClassificacao(classificacaoId: number, categoriaId: string): void {
    this.categoriaPorClassificacao = { ...this.categoriaPorClassificacao, [classificacaoId]: categoriaId ? Number(categoriaId) : null };
    this.previewIbge = null;
    this.erroValorIbge = null;
  }

  private montarClassificacoesIbge(): Record<number, number> {
    const classificacoes: Record<number, number> = {};
    for (const [id, categoriaId] of Object.entries(this.categoriaPorClassificacao)) {
      if (Number(id) === this.classificacaoAnoId) continue;
      if (categoriaId) classificacoes[Number(id)] = categoriaId;
    }
    return classificacoes;
  }

  buscarValorIbgePreview(): void {
    if (!this.variavelIbgeId || !this.tabelaIbgeSelecionada) return;

    this.buscandoValorIbge = true;
    this.previewIbge = null;
    this.erroValorIbge = null;
    this.api
      .criar<{ valor: string; complemento: string }>('ibge/valor', {
        tabela: this.tabelaIbgeSelecionada.id,
        variavel: this.variavelIbgeId,
        classificacoes: this.montarClassificacoesIbge(),
        classificacaoAno: this.classificacaoAnoId,
        casasDecimais: this.casasDecimaisIbge,
        complementoModelo: this.complementoModeloIbge,
      })
      .subscribe({
        next: (resultado) => {
          this.previewIbge = resultado;
          this.buscandoValorIbge = false;
        },
        error: (erro: HttpErrorResponse) => {
          this.erroValorIbge = typeof erro.error === 'string' ? erro.error : 'Não foi possível encontrar um valor pra essa combinação. Tente outra variável ou classificação.';
          this.buscandoValorIbge = false;
        },
      });
  }

  private montarConfigIbgeJson(): string | null {
    if (!this.usandoIbge || !this.tabelaIbgeSelecionada || !this.variavelIbgeId) return null;

    return JSON.stringify({
      tabela: this.tabelaIbgeSelecionada.id,
      variavel: this.variavelIbgeId,
      classificacoes: this.montarClassificacoesIbge(),
      classificacaoAno: this.classificacaoAnoId,
      casasDecimais: this.casasDecimaisIbge,
      complementoModelo: this.complementoModeloIbge,
    });
  }

  private parsearConfigIbge(json: string | null): {
    tabela: number;
    variavel: number;
    classificacoes: Record<number, number>;
    classificacaoAno: number | null;
    casasDecimais: number;
    complementoModelo: string;
  } | null {
    if (!json) return null;
    try {
      return JSON.parse(json);
    } catch {
      return null;
    }
  }

  salvarIndicador(): void {
    const configIbge = this.montarConfigIbgeJson();
    const payload = {
      categoriaId: this.categoriaIdAtual,
      rotulo: this.formIndicador.value.rotulo,
      valor: this.formIndicador.value.valor || '—',
      complemento: this.formIndicador.value.complemento || null,
      indicadorIbgeConfigJson: configIbge,
      ordem: this.editandoIndicadorId
        ? this.indicadores.find((i) => i.id === this.editandoIndicadorId)?.ordem ?? 0
        : this.indicadores.length + 1,
    };

    const requisicao = this.editandoIndicadorId
      ? this.api.atualizar<IndicadorAdmin>('indicadores-observatorio', this.editandoIndicadorId, payload)
      : this.api.criar<IndicadorAdmin>('indicadores-observatorio', payload);

    requisicao.subscribe(() => {
      this.fecharEdicaoIndicador();
      this.carregarBlocosEIndicadores();
      this.atualizarPreview();
    });
  }

  async excluirIndicador(indicador: IndicadorAdmin): Promise<void> {
    const ok = await this.swal.confirmarExclusao(`Excluir o indicador "${indicador.rotulo}"?`);
    if (!ok) return;

    this.api.excluir('indicadores-observatorio', indicador.id).subscribe(() => {
      this.carregarBlocosEIndicadores();
      this.atualizarPreview();
    });
  }

  soltarIndicador(event: CdkDragDrop<IndicadorAdmin[]>): void {
    const lista = [...this.indicadores];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.indicadores = lista;

    lista.forEach((indicador, indice) => {
      const novaOrdem = indice + 1;
      if (indicador.ordem === novaOrdem) return;
      indicador.ordem = novaOrdem;
      this.api.atualizar('indicadores-observatorio', indicador.id, { ...indicador }).subscribe();
    });
    this.atualizarPreview();
  }

  // ---- Helpers de preview (usam os mesmos componentes da página pública) ----

  previewArtigos(preview: PreviewBloco): BlogArticle[] {
    return (preview.artigos ?? []).map((a) => ({
      date: a.publishedAt ? new Date(a.publishedAt).toLocaleDateString('pt-BR') : '',
      title: a.title,
      excerpt: a.excerpt,
      image: a.image,
      href: '#',
    }));
  }

  previewCard(secao: PreviewSecao): ContentCard {
    return {
      icon: (secao.icone ?? 'dot') as IconGlyph,
      title: secao.nome,
      image: null,
      excerpt: secao.resumo ?? '',
      linkLabel: 'Explorar',
      href: '#',
    };
  }
}
