import { Component, HostListener, OnDestroy, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ArtigoAdmin, CategoriaAdmin } from '../../core/models/admin.model';
import { BlocoHome } from '../../core/models/home.model';
import { QuillEditorComponent } from '../../shared/components/quill-editor/quill-editor.component';
import { LinkVinculoComponent } from '../../shared/components/link-vinculo/link-vinculo.component';
import { HomeBlocoComponent } from '../home/components/home-bloco/home-bloco.component';

type TipoBloco = 'Carrossel' | 'EmAlta' | 'GradeArtigos' | 'DadosSaude' | 'Patrocinio' | 'SelosConfianca' | 'Texto';
type Modo = 'Manual' | 'ArtigoFixo' | 'DestaquesAuto' | 'RecentesAuto' | 'MaisVistosAuto' | 'MaisSalvosAuto';

interface BlocoAdmin {
  id: number;
  tipo: TipoBloco;
  titulo: string | null;
  conteudoHtml: string | null;
  limiteItens: number;
  ordem: number;
  colunas: number;
  visivel: boolean;
  modo: Modo;
  categoriaFiltroId: number | null;
  configuracaoJson: string | null;
}

interface InfoTipo {
  tipo: TipoBloco;
  nome: string;
  icone: string;
  descricao: string;
  colunasPadrao: number;
  modos: Modo[];
  recursoItens?: { path: string; nome: string };
}

const ROTULOS_MODO: Record<Modo, string> = {
  Manual: 'Eu escolho os artigos',
  ArtigoFixo: 'Um artigo fixo (sem rotação)',
  DestaquesAuto: 'Automático — artigos marcados como destaque',
  RecentesAuto: 'Automático — os mais recentes',
  MaisVistosAuto: 'Automático — os mais vistos',
  MaisSalvosAuto: 'Automático — os mais salvos',
};

const TIPOS: InfoTipo[] = [
  {
    tipo: 'Carrossel',
    nome: 'Carrossel de destaque',
    icone: 'fa-images',
    descricao: 'O destaque grande da página, com imagem. Passa sozinho entre os artigos escolhidos.',
    colunasPadrao: 8,
    modos: ['Manual', 'ArtigoFixo', 'DestaquesAuto', 'RecentesAuto', 'MaisVistosAuto', 'MaisSalvosAuto'],
  },
  {
    tipo: 'EmAlta',
    nome: 'Em alta',
    icone: 'fa-fire',
    descricao: 'Lista numerada com os artigos do momento.',
    colunasPadrao: 4,
    modos: ['Manual', 'MaisVistosAuto', 'MaisSalvosAuto', 'RecentesAuto'],
  },
  {
    tipo: 'GradeArtigos',
    nome: 'Grade de artigos',
    icone: 'fa-table-cells-large',
    descricao: 'Cards de artigos lado a lado. Escolha na mão ou deixe automático (recentes, mais vistos, de um tópico...).',
    colunasPadrao: 12,
    modos: ['Manual', 'RecentesAuto', 'MaisVistosAuto', 'MaisSalvosAuto'],
  },
  {
    tipo: 'DadosSaude',
    nome: 'Dados da Saúde',
    icone: 'fa-chart-simple',
    descricao: 'Os números de saúde do Brasil, com dados do IBGE. Os números vêm do cadastro "Dados da Saúde".',
    colunasPadrao: 12,
    modos: [],
    recursoItens: { path: 'dados-saude', nome: 'Dados da Saúde' },
  },
  {
    tipo: 'Patrocinio',
    nome: 'Espaços patrocinados',
    icone: 'fa-bullhorn',
    descricao: 'Anúncios, conteúdo de marca e patrocínios. Vêm do cadastro "Espaços Patrocinados".',
    colunasPadrao: 12,
    modos: [],
    recursoItens: { path: 'espacos-patrocinados', nome: 'Espaços Patrocinados' },
  },
  {
    tipo: 'SelosConfianca',
    nome: 'Selos de confiança',
    icone: 'fa-shield-halved',
    descricao: 'Faixa com os selos de credibilidade do portal. Vêm do cadastro "Selos de Confiança".',
    colunasPadrao: 12,
    modos: [],
    recursoItens: { path: 'selos-confianca', nome: 'Selos de Confiança' },
  },
  {
    tipo: 'Texto',
    nome: 'Texto livre',
    icone: 'fa-align-left',
    descricao: 'Um título e um texto formatado — bom pra avisos, chamadas ou apresentações.',
    colunasPadrao: 12,
    modos: [],
  },
];

const LARGURAS = [
  { colunas: 12, nome: 'Linha inteira' },
  { colunas: 8, nome: 'Dois terços' },
  { colunas: 6, nome: 'Metade' },
  { colunas: 4, nome: 'Um terço' },
];

@Component({
  selector: 'app-home-admin',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    DragDropModule,
    QuillEditorComponent,
    LinkVinculoComponent,
    HomeBlocoComponent,
  ],
  templateUrl: './home-admin.component.html',
  styleUrl: './home-admin.component.scss',
})
export class HomeAdminComponent implements OnInit, OnDestroy, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);
  private destruido = new Subject<void>();

  readonly tipos = TIPOS;
  readonly larguras = LARGURAS;
  readonly rotulosModo = ROTULOS_MODO;

  carregando = true;
  erro: string | null = null;
  salvando = false;

  blocos: BlocoAdmin[] = [];
  artigos: ArtigoAdmin[] = [];
  categorias: CategoriaAdmin[] = [];

  escolhendoTipo = false;
  criando = false;
  editandoId: number | null = null;
  artigosSelecionados: ArtigoAdmin[] = [];

  preview: BlocoHome | null = null;
  carregandoPreview = false;
  erroPreview: string | null = null;

  formBloco = this.fb.nonNullable.group({
    tipo: ['GradeArtigos' as TipoBloco],
    titulo: [''],
    conteudoHtml: [''],
    limiteItens: [4],
    colunas: [12],
    visivel: [true],
    modo: ['RecentesAuto' as Modo],
    categoriaFiltroId: [null as number | null],
    autoplaySegundos: [6],
    label: ['Em alta'],
    href: ['/blog'],
    linkLabel: ['Ver mais'],
  });

  ngOnInit(): void {
    this.carregarBlocos();
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => (this.artigos = artigos));
    this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => (this.categorias = categorias));

    this.formBloco.valueChanges.pipe(debounceTime(400), takeUntil(this.destruido)).subscribe(() => this.atualizarPreview());
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formBloco.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  // ---- Consultas auxiliares ----

  infoDoTipo(tipo: TipoBloco | string | null | undefined): InfoTipo {
    return TIPOS.find((t) => t.tipo === tipo) ?? TIPOS[2];
  }

  get infoAtual(): InfoTipo {
    return this.infoDoTipo(this.formBloco.value.tipo);
  }

  get emEdicao(): boolean {
    return this.criando || this.editandoId !== null;
  }

  get usaArtigos(): boolean {
    return this.infoAtual.modos.length > 0;
  }

  get modoEscolhaManual(): boolean {
    const modo = this.formBloco.value.modo;
    return this.usaArtigos && (modo === 'Manual' || modo === 'ArtigoFixo');
  }

  get artigosDisponiveis(): ArtigoAdmin[] {
    return this.artigos.filter((a) => !this.artigosSelecionados.some((s) => s.id === a.id));
  }

  get blocoEditado(): BlocoAdmin | null {
    return this.blocos.find((b) => b.id === this.editandoId) ?? null;
  }

  get larguraPreview(): number {
    return ((this.formBloco.value.colunas ?? 12) / 12) * 100;
  }

  nomeLargura(colunas: number): string {
    return LARGURAS.find((l) => l.colunas === colunas)?.nome ?? `${colunas}/12`;
  }

  resumoBloco(bloco: BlocoAdmin): string {
    const info = this.infoDoTipo(bloco.tipo);
    const partes = [this.nomeLargura(bloco.colunas)];
    if (info.modos.length) partes.push(ROTULOS_MODO[bloco.modo].replace('Automático — ', ''));
    return partes.join(' · ');
  }

  tituloBloco(bloco: BlocoAdmin): string {
    const info = this.infoDoTipo(bloco.tipo);
    return bloco.titulo ? `${info.nome}: ${bloco.titulo}` : info.nome;
  }

  // ---- Carregar ----

  private carregarBlocos(): void {
    this.carregando = true;
    this.api.listar<BlocoAdmin>('blocos-home').subscribe({
      next: (blocos) => {
        this.blocos = blocos.sort((a, b) => a.ordem - b.ordem);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a Home.';
        this.carregando = false;
      },
    });
  }

  // ---- Adicionar / editar ----

  async abrirEscolhaDeTipo(): Promise<void> {
    if (this.formBloco.dirty && !(await this.swal.confirmarSaidaComAlteracoes())) return;
    await this.fecharEdicao(false);
    this.escolhendoTipo = true;
  }

  async selecionar(bloco: BlocoAdmin): Promise<void> {
    if (this.editandoId === bloco.id) return;
    if (this.formBloco.dirty && !(await this.swal.confirmarSaidaComAlteracoes())) return;
    this.formBloco.markAsPristine();
    this.editar(bloco);
  }

  escolherTipo(info: InfoTipo): void {
    this.escolhendoTipo = false;
    this.criando = true;
    this.editandoId = null;
    this.artigosSelecionados = [];
    this.formBloco.reset({
      tipo: info.tipo,
      titulo: info.tipo === 'DadosSaude' ? 'Dados da Saúde no Brasil' : '',
      conteudoHtml: '',
      limiteItens: info.tipo === 'EmAlta' ? 5 : info.tipo === 'Carrossel' ? 5 : 4,
      colunas: info.colunasPadrao,
      visivel: true,
      modo: info.modos.includes('RecentesAuto') ? 'RecentesAuto' : info.modos[0] ?? 'RecentesAuto',
      categoriaFiltroId: null,
      autoplaySegundos: 6,
      label: 'Em alta',
      href: '/blog',
      linkLabel: 'Ver mais',
    });
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  private editar(bloco: BlocoAdmin): void {
    this.escolhendoTipo = false;
    this.criando = false;
    this.editandoId = bloco.id;

    const config = this.lerConfig(bloco.configuracaoJson);
    const ids = Array.isArray(config['artigoIds']) ? (config['artigoIds'] as number[]) : [];
    this.artigosSelecionados = ids.map((id) => this.artigos.find((a) => a.id === id)).filter((a): a is ArtigoAdmin => !!a);

    this.formBloco.reset({
      tipo: bloco.tipo,
      titulo: bloco.titulo ?? '',
      conteudoHtml: bloco.conteudoHtml ?? '',
      limiteItens: bloco.limiteItens || 4,
      colunas: bloco.colunas,
      visivel: bloco.visivel,
      modo: bloco.modo,
      categoriaFiltroId: bloco.categoriaFiltroId,
      autoplaySegundos: Number(config['autoplaySegundos']) || 6,
      label: (config['label'] as string) ?? 'Em alta',
      href: (config['href'] as string) ?? '/blog',
      linkLabel: (config['linkLabel'] as string) ?? 'Ver mais',
    });
    this.atualizarPreview();
  }

  async fecharEdicao(confirmar = true): Promise<void> {
    if (confirmar && this.formBloco.dirty && !(await this.swal.confirmarSaidaComAlteracoes())) return;

    this.criando = false;
    this.editandoId = null;
    this.artigosSelecionados = [];
    this.preview = null;
    this.erroPreview = null;
    this.formBloco.markAsPristine();
  }

  adicionarArtigo(id: number): void {
    const artigo = this.artigos.find((a) => a.id === id);
    if (!artigo) return;

    // "Artigo fixo" só mostra 1: escolher outro substitui.
    this.artigosSelecionados = this.formBloco.value.modo === 'ArtigoFixo' ? [artigo] : [...this.artigosSelecionados, artigo];
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  removerArtigo(artigo: ArtigoAdmin): void {
    this.artigosSelecionados = this.artigosSelecionados.filter((a) => a.id !== artigo.id);
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  soltarArtigo(evento: CdkDragDrop<ArtigoAdmin[]>): void {
    const lista = [...this.artigosSelecionados];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.artigosSelecionados = lista;
    this.formBloco.markAsDirty();
    this.atualizarPreview();
  }

  // ---- Montar payload / preview ----

  private lerConfig(json: string | null): Record<string, unknown> {
    if (!json) return {};
    try {
      return JSON.parse(json) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  private montarPayload(): Record<string, unknown> {
    const v = this.formBloco.getRawValue();
    const config: Record<string, unknown> = {};

    if (this.modoEscolhaManual) config['artigoIds'] = this.artigosSelecionados.map((a) => a.id);
    if (v.tipo === 'Carrossel') config['autoplaySegundos'] = v.autoplaySegundos || 6;
    if (v.tipo === 'EmAlta') {
      config['label'] = v.label || 'Em alta';
      config['href'] = v.href || '/blog';
      config['linkLabel'] = v.linkLabel || 'Ver mais';
    }

    const existente = this.blocos.find((b) => b.id === this.editandoId);
    return {
      tipo: v.tipo,
      titulo: v.titulo || null,
      conteudoHtml: v.tipo === 'Texto' ? v.conteudoHtml : null,
      limiteItens: Math.max(1, Number(v.limiteItens) || 4),
      ordem: existente ? existente.ordem : this.blocos.length + 1,
      colunas: v.colunas,
      visivel: v.visivel,
      modo: this.usaArtigos ? v.modo : 'RecentesAuto',
      categoriaFiltroId: this.usaArtigos && !this.modoEscolhaManual ? v.categoriaFiltroId : null,
      configuracaoJson: Object.keys(config).length ? JSON.stringify(config) : null,
    };
  }

  private atualizarPreview(): void {
    if (!this.emEdicao) return;

    this.carregandoPreview = true;
    this.erroPreview = null;
    this.api.criar<BlocoHome>('blocos-home/preview', this.montarPayload()).subscribe({
      next: (resultado) => {
        this.preview = resultado;
        this.carregandoPreview = false;
      },
      error: () => {
        this.erroPreview = 'Não foi possível montar a prévia.';
        this.carregandoPreview = false;
      },
    });
  }

  // ---- Salvar / excluir / ordem / visibilidade ----

  salvar(): void {
    const payload = this.montarPayload();
    this.salvando = true;

    const requisicao = this.editandoId
      ? this.api.atualizar<BlocoAdmin>('blocos-home', this.editandoId, payload)
      : this.api.criar<BlocoAdmin>('blocos-home', payload);

    requisicao.subscribe({
      next: (salvo) => {
        this.salvando = false;
        this.formBloco.markAsPristine();
        this.criando = false;
        this.editandoId = null;
        this.preview = null;
        this.api.listar<BlocoAdmin>('blocos-home').subscribe((blocos) => {
          this.blocos = blocos.sort((a, b) => a.ordem - b.ordem);
          const novo = this.blocos.find((b) => b.id === salvo.id);
          if (novo) this.editar(novo);
        });
      },
      error: () => {
        this.salvando = false;
        this.swal.erro('Não foi possível salvar o bloco.');
      },
    });
  }

  async excluir(bloco: BlocoAdmin): Promise<void> {
    const ok = await this.swal.confirmarExclusao(`Remover "${this.tituloBloco(bloco)}" da Home? Se só quiser esconder por um tempo, use o olhinho da lista.`);
    if (!ok) return;

    this.api.excluir('blocos-home', bloco.id).subscribe(() => {
      if (this.editandoId === bloco.id) {
        this.formBloco.markAsPristine();
        this.editandoId = null;
        this.preview = null;
      }
      this.carregarBlocos();
    });
  }

  alternarVisivel(bloco: BlocoAdmin, evento: Event): void {
    evento.stopPropagation();
    const visivel = !bloco.visivel;
    this.api.atualizar('blocos-home', bloco.id, this.payloadDe({ ...bloco, visivel })).subscribe(() => {
      bloco.visivel = visivel;
      if (this.editandoId === bloco.id) this.formBloco.patchValue({ visivel }, { emitEvent: false });
    });
  }

  soltarBloco(evento: CdkDragDrop<BlocoAdmin[]>): void {
    const lista = [...this.blocos];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.blocos = lista;

    lista.forEach((bloco, indice) => {
      const ordem = indice + 1;
      if (bloco.ordem === ordem) return;
      bloco.ordem = ordem;
      this.api.atualizar('blocos-home', bloco.id, this.payloadDe(bloco)).subscribe();
    });
  }

  private payloadDe(bloco: BlocoAdmin): Record<string, unknown> {
    return {
      tipo: bloco.tipo,
      titulo: bloco.titulo,
      conteudoHtml: bloco.conteudoHtml,
      limiteItens: bloco.limiteItens,
      ordem: bloco.ordem,
      colunas: bloco.colunas,
      visivel: bloco.visivel,
      modo: bloco.modo,
      categoriaFiltroId: bloco.categoriaFiltroId,
      configuracaoJson: bloco.configuracaoJson,
    };
  }
}
