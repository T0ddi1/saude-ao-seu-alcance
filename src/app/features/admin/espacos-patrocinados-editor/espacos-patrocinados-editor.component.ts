import { DicaImagemComponent } from '../../../shared/components/dica-imagem/dica-imagem.component';
import { Component, EventEmitter, HostListener, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { SwalService } from '../../../core/services/swal.service';
import { UploadService } from '../../../core/services/upload.service';
import { ArtigoAdmin, CategoriaAdmin, EspacoPatrocinadoAdmin } from '../../../core/models/admin.model';
import { LinkVinculoComponent } from '../../../shared/components/link-vinculo/link-vinculo.component';
import { contaGotasDisponivel, corDoTextoSobre, ehCorValida, extrairCorDominante, usarContaGotas } from '../../../shared/utils/cor.util';

type Formato = 'card' | 'banner';
type Publicacao = 'sempre' | 'agendar';
type Situacao = 'no-ar' | 'agendado' | 'encerrado' | 'escondido';

interface PaginaResumo {
  id: number;
  titulo: string;
  slug: string;
}

interface Conflito {
  sobrepostos: EspacoPatrocinadoAdmin[];
  maximoSimultaneos: number;
  excede: boolean;
}

const ROTULOS_TIPO: Record<string, string> = {
  Patrocinio: 'Patrocínio',
  ConteudoDeMarca: 'Conteúdo de marca',
  Anuncio: 'Anúncio',
};

const TEMAS_CARD = [
  { valor: 'Light', nome: 'Claro' },
  { valor: 'Dark', nome: 'Escuro' },
  { valor: 'Brand', nome: 'Cor da marca' },
];

const TAMANHOS = [
  { valor: 'Sm', nome: 'Pequeno (3 colunas)' },
  { valor: 'Md', nome: 'Médio (4 colunas)' },
  { valor: 'Lg', nome: 'Grande (6 colunas)' },
  { valor: 'Xl', nome: 'Extra grande (linha inteira)' },
];

const dois = (n: number) => String(n).padStart(2, '0');

/** ISO (UTC) da API -> valor do <input type="datetime-local"> no horário do navegador. */
function paraCampoLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

/** Valor do campo local -> ISO UTC (ou null se vazio). */
function deCampoLocal(valor: string | null | undefined): string | null {
  return valor ? new Date(valor).toISOString() : null;
}

@Component({
  selector: 'app-espacos-patrocinados-editor',
  standalone: true,
  imports: [DicaImagemComponent, CommonModule, ReactiveFormsModule, DragDropModule, LinkVinculoComponent],
  templateUrl: './espacos-patrocinados-editor.component.html',
  styleUrl: './espacos-patrocinados-editor.component.scss',
})
export class EspacosPatrocinadosEditorComponent implements OnInit {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);
  private upload = inject(UploadService);

  /** Quantos espaços o bloco da Home mostra ao mesmo tempo — acima disso, datas que se cruzam viram conflito. */
  @Input() limite = 3;
  /** Avisa a tela de fora que algo mudou (pra atualizar a prévia da Home). */
  @Output() alterou = new EventEmitter<void>();

  readonly rotulosTipo = ROTULOS_TIPO;
  readonly temasCard = TEMAS_CARD;
  readonly tamanhos = TAMANHOS;

  itens: EspacoPatrocinadoAdmin[] = [];
  artigos: ArtigoAdmin[] = [];
  paginas: PaginaResumo[] = [];
  categorias: CategoriaAdmin[] = [];

  carregando = true;
  erro: string | null = null;

  modalAberto = false;
  editando: EspacoPatrocinadoAdmin | null = null;
  salvando = false;
  enviando: Record<'imagemUrl' | 'logoUrl', boolean> = { imagemUrl: false, logoUrl: false };

  form = this.fb.nonNullable.group({
    formato: ['card' as Formato],
    tema: ['Light'],
    tipo: ['Patrocinio'],
    chamada: [''],
    titulo: ['', Validators.required],
    descricao: [''],
    textoBotao: ['Saiba mais'],
    link: ['', Validators.required],
    externo: [false],
    imagemUrl: [''],
    logoUrl: [''],
    tamanho: ['Md'],
    corFundo: [''],
    ativo: [true],
    publicacao: ['sempre' as Publicacao],
    inicio: [''],
    fim: [''],
  });

  ngOnInit(): void {
    this.carregar();
    this.api.listar<ArtigoAdmin>('artigos').subscribe((a) => (this.artigos = a));
    this.api.listar<PaginaResumo>('paginas-institucionais').subscribe((p) => (this.paginas = p));
    this.api.listar<CategoriaAdmin>('categorias').subscribe((c) => (this.categorias = c));
  }

  /** O popup fica dentro do formulário do bloco da Home: Enter não pode salvar o bloco por tabela. */
  bloquearEnter(evento: KeyboardEvent): void {
    const alvo = evento.target as HTMLElement;
    if (alvo.tagName !== 'TEXTAREA' && alvo.tagName !== 'BUTTON') evento.preventDefault();
  }

  /** Só fecha quando o clique é no fundo escuro. Não pode ser uma expressão `a && b` no template: o Angular trata `false` como preventDefault e os campos do popup perdem o foco. */
  aoPressionarFundo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.fechar();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.modalAberto) this.fechar();
  }

  // ---- Lista ----

  private carregar(): void {
    this.carregando = true;
    this.api.listar<EspacoPatrocinadoAdmin>('espacos-patrocinados').subscribe({
      next: (itens) => {
        this.itens = itens.sort((a, b) => a.ordem - b.ordem);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os espaços patrocinados.';
        this.carregando = false;
      },
    });
  }

  situacao(item: EspacoPatrocinadoAdmin): Situacao {
    if (!item.ativo) return 'escondido';
    const agora = Date.now();
    if (item.dataInicioVigencia && new Date(item.dataInicioVigencia).getTime() > agora) return 'agendado';
    if (item.dataFimVigencia && new Date(item.dataFimVigencia).getTime() <= agora) return 'encerrado';
    return 'no-ar';
  }

  rotuloSituacao(item: EspacoPatrocinadoAdmin): string {
    switch (this.situacao(item)) {
      case 'escondido':
        return 'Escondido do site';
      case 'agendado':
        return `Entra no ar em ${this.formatar(item.dataInicioVigencia)}`;
      case 'encerrado':
        return `Encerrado em ${this.formatar(item.dataFimVigencia)}`;
      default:
        return item.dataFimVigencia ? `No ar até ${this.formatar(item.dataFimVigencia)}` : 'No ar';
    }
  }

  formatar(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }

  rotuloFormato(item: EspacoPatrocinadoAdmin): string {
    return item.tema === 'Banner' ? 'Banner' : 'Card com texto';
  }

  /** Conflito de um item que já está salvo (usado pelo selo de alerta na lista). */
  temConflito(item: EspacoPatrocinadoAdmin): boolean {
    if (!item.ativo || this.situacao(item) === 'encerrado') return false;
    return this.conflitoDe(item.id, item.dataInicioVigencia ?? null, item.dataFimVigencia ?? null).excede;
  }

  // ---- Conflito de datas ----

  private intervalo(inicio: string | null, fim: string | null): [number, number] {
    return [inicio ? new Date(inicio).getTime() : -Infinity, fim ? new Date(fim).getTime() : Infinity];
  }

  /** Quais espaços ficam no ar ao mesmo tempo que esse, e se isso passa do que o bloco comporta. */
  conflitoDe(id: number | null, inicio: string | null, fim: string | null): Conflito {
    const [a1, a2] = this.intervalo(inicio, fim);
    const sobrepostos = this.itens.filter((o) => {
      if (o.id === id || !o.ativo) return false;
      const [b1, b2] = this.intervalo(o.dataInicioVigencia ?? null, o.dataFimVigencia ?? null);
      if (b2 <= Date.now()) return false; // já encerrado
      return a1 < b2 && b1 < a2;
    });

    // Varre os instantes em que alguém entra no ar dentro da janela pra achar o pico de itens simultâneos.
    const pontos = [a1, ...sobrepostos.map((o) => this.intervalo(o.dataInicioVigencia ?? null, o.dataFimVigencia ?? null)[0])].filter(
      (p) => p >= a1 && p < a2,
    );
    let maximo = 1;
    for (const ponto of pontos) {
      const naquele = sobrepostos.filter((o) => {
        const [b1, b2] = this.intervalo(o.dataInicioVigencia ?? null, o.dataFimVigencia ?? null);
        return b1 <= ponto && ponto < b2;
      }).length;
      maximo = Math.max(maximo, naquele + 1);
    }

    return { sobrepostos, maximoSimultaneos: maximo, excede: maximo > Math.max(1, this.limite) };
  }

  get conflitoAtual(): Conflito | null {
    const v = this.form.getRawValue();
    if (!v.ativo) return null;
    const inicio = v.publicacao === 'agendar' ? deCampoLocal(v.inicio) : null;
    const fim = v.publicacao === 'agendar' ? deCampoLocal(v.fim) : null;
    return this.conflitoDe(this.editando?.id ?? null, inicio, fim);
  }

  // ---- Modal ----

  abrirNovo(): void {
    this.editando = null;
    this.form.reset({
      formato: 'card',
      tema: 'Light',
      tipo: 'Patrocinio',
      chamada: '',
      titulo: '',
      descricao: '',
      textoBotao: 'Saiba mais',
      link: '',
      externo: false,
      imagemUrl: '',
      logoUrl: '',
      tamanho: 'Md',
      corFundo: '',
      ativo: true,
      publicacao: 'sempre',
      inicio: '',
      fim: '',
    });
    this.modalAberto = true;
  }

  abrirEdicao(item: EspacoPatrocinadoAdmin): void {
    this.editando = item;
    const agendado = !!(item.dataInicioVigencia || item.dataFimVigencia);
    this.form.reset({
      formato: item.tema === 'Banner' ? 'banner' : 'card',
      tema: item.tema === 'Banner' ? 'Light' : item.tema,
      tipo: item.tipo,
      chamada: item.chamada,
      titulo: item.titulo,
      descricao: item.descricao ?? '',
      textoBotao: item.textoBotao ?? '',
      link: item.link,
      externo: item.externo,
      imagemUrl: item.imagemUrl ?? '',
      logoUrl: item.logoUrl ?? '',
      tamanho: item.tamanho,
      corFundo: item.corFundo ?? '',
      ativo: item.ativo,
      publicacao: agendado ? 'agendar' : 'sempre',
      inicio: paraCampoLocal(item.dataInicioVigencia),
      fim: paraCampoLocal(item.dataFimVigencia),
    });
    this.modalAberto = true;
  }

  async fechar(): Promise<void> {
    if (this.form.dirty && !(await this.swal.confirmarSaidaComAlteracoes())) return;
    this.modalAberto = false;
    this.form.markAsPristine();
  }

  vincular(caminho: string): void {
    this.form.patchValue({ link: caminho, externo: /^https?:\/\//i.test(caminho) });
    this.form.markAsDirty();
  }

  enviarImagem(evento: Event, campo: 'imagemUrl' | 'logoUrl'): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviando[campo] = true;
    this.upload.enviar(arquivo).subscribe({
      next: (url) => {
        this.form.patchValue({ [campo]: url });
        this.form.markAsDirty();
        this.enviando[campo] = false;
      },
      error: () => {
        this.enviando[campo] = false;
        this.swal.erro('Não foi possível enviar a imagem.');
      },
    });
    input.value = '';
  }

  removerImagem(campo: 'imagemUrl' | 'logoUrl'): void {
    this.form.patchValue({ [campo]: '' });
    this.form.markAsDirty();
  }

  /** Largura (px) que cada tamanho ocupa na Home em tela cheia; a altura do espaço é sempre 267 px. */
  private static readonly LARGURAS: Record<string, number> = { Sm: 190, Md: 400, Lg: 610, Xl: 1230 };
  private static readonly ALTURA = 267;

  /** Explica qual imagem não fica cortada, conforme o formato e a largura escolhidos. */
  get dicaImagem(): string {
    const v = this.form.getRawValue();
    const largura = EspacosPatrocinadosEditorComponent.LARGURAS[v.tamanho] ?? 400;
    const altura = EspacosPatrocinadosEditorComponent.ALTURA;
    const dobro = `${largura * 2} × ${altura * 2} px`;
    const medida = `${largura} × ${altura} px`;

    if (v.formato === 'banner') {
      return `Com a largura "${this.nomeTamanho(v.tamanho)}", o banner ocupa ${medida} na Home. Ideal: ${dobro} (proporção ${this.proporcao(largura, altura)}), pra ficar nítido. Ele aparece inteiro, sem corte; se a proporção for diferente, sobram bordas brancas.`;
    }
    if (v.tema === 'Dark') {
      return `A imagem vira o fundo do card inteiro (${medida}) e é cortada pra preencher. Ideal: ${dobro} (proporção ${this.proporcao(largura, altura)}), com o assunto principal no centro e a parte de baixo mais escura/calma, pois o texto fica por cima.`;
    }
    if (v.tema === 'Light') {
      const larguraImagem = Math.max(120, Math.round(largura * 0.43));
      return `A imagem aparece à direita do texto (cerca de ${larguraImagem} × ${altura} px) e é cortada pra preencher. Ideal: ${larguraImagem * 2} × ${altura * 2} px (proporção ${this.proporcao(larguraImagem, altura)}), com o assunto no centro. Em celular ela vai pro topo do card, em formato 16:9.`;
    }
    return `No estilo "Cor da marca" o card (${medida}) não mostra imagem de fundo: a cor vem do seletor abaixo e a marca aparece pelo logo. Uma imagem enviada aqui serve só pra "Pegar da imagem" (cor); se preferir, use 800 × 534 px. Pra mostrar foto no card, escolha o estilo Claro ou Escuro.`;
  }

  get dicaLogo(): string {
    return 'Use PNG ou SVG com fundo transparente e formato bem horizontal (ex.: 400 × 100 px). Ele aparece com 26 px de altura (34 px no estilo "Cor da marca") e sem corte.';
  }

  private nomeTamanho(tamanho: string): string {
    return (TAMANHOS.find((t) => t.valor === tamanho)?.nome ?? tamanho).replace(/ \(.*\)/, '');
  }

  /** Proporção aproximada em forma de "L:A" usando os formatos conhecidos (16:9, 4:3, 3:2...). */
  private proporcao(largura: number, altura: number): string {
    const razao = largura / altura;
    const conhecidas: [number, string][] = [
      [0.5, '1:2'], [0.667, '2:3'], [0.75, '3:4'], [1, '1:1'], [1.333, '4:3'], [1.5, '3:2'], [1.778, '16:9'], [2, '2:1'], [2.333, '21:9'], [3, '3:1'], [4.6, '4,6:1'],
    ];
    const perto = conhecidas.reduce((a, b) => (Math.abs(b[0] - razao) < Math.abs(a[0] - razao) ? b : a));
    return Math.abs(perto[0] - razao) / razao < 0.12 ? perto[1] : `${razao.toFixed(1).replace('.', ',')}:1`;
  }

  // ---- Cor do card "Cor da marca" ----

  readonly corPadrao = '#004AAD';
  readonly temContaGotas = contaGotasDisponivel();
  lendoCor = false;
  avisoCor: string | null = null;

  /** Cor que o card vai ter (a escolhida, ou a padrão do site). */
  get corEfetiva(): string {
    const cor = this.form.value.corFundo;
    return ehCorValida(cor) ? cor : this.corPadrao;
  }

  get corDoTexto(): string {
    return corDoTextoSobre(this.corEfetiva);
  }

  get usandoCorPadrao(): boolean {
    return !ehCorValida(this.form.value.corFundo);
  }

  definirCor(cor: string): void {
    this.avisoCor = null;
    this.form.patchValue({ corFundo: cor.toUpperCase() });
    this.form.markAsDirty();
  }

  /** Aceita o que a pessoa digitar (com ou sem #, 3 ou 6 dígitos) e só aplica quando estiver completo. */
  digitarCor(texto: string): void {
    let valor = texto.trim().replace(/^#?/, '#');
    if (/^#[0-9a-fA-F]{3}$/.test(valor)) valor = '#' + [...valor.slice(1)].map((c) => c + c).join('');
    this.form.patchValue({ corFundo: valor.toUpperCase() }, { emitEvent: false });
    this.form.markAsDirty();
  }

  voltarCorPadrao(): void {
    this.avisoCor = null;
    this.form.patchValue({ corFundo: '' });
    this.form.markAsDirty();
  }

  async pegarCorDaImagem(campo: 'logoUrl' | 'imagemUrl'): Promise<void> {
    const url = this.form.value[campo];
    if (!url) return;
    this.lendoCor = true;
    this.avisoCor = null;
    const cor = await extrairCorDominante(url);
    this.lendoCor = false;
    if (cor) this.definirCor(cor);
    else this.avisoCor = 'Não consegui ler a cor dessa imagem. Escolha a cor manualmente no quadrado ou use o conta-gotas.';
  }

  async usarContaGotas(): Promise<void> {
    const cor = await usarContaGotas();
    if (cor) this.definirCor(cor);
  }

  get minimoAgora(): string {
    return paraCampoLocal(new Date().toISOString());
  }

  async salvar(): Promise<void> {
    const v = this.form.getRawValue();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.swal.alerta(v.formato === 'banner' ? 'Preencha o nome e o link do banner.' : 'Preencha o título e o link.', 'Faltam dados');
      return;
    }
    if (v.formato === 'banner' && !v.imagemUrl) {
      await this.swal.alerta('Um banner precisa de uma imagem. Envie a arte do banner.', 'Faltou a imagem');
      return;
    }

    let inicio: string | null = null;
    let fim: string | null = null;
    if (v.publicacao === 'agendar') {
      inicio = deCampoLocal(v.inicio);
      fim = deCampoLocal(v.fim);
      if (!inicio && !fim) {
        await this.swal.alerta('Escolha quando entra no ar e/ou quando sai do ar — ou marque "Sempre no ar".', 'Agendamento');
        return;
      }
      if (inicio && fim && new Date(fim) <= new Date(inicio)) {
        await this.swal.alerta('A data de término precisa ser depois da data de início.', 'Datas inválidas');
        return;
      }
      if (fim && new Date(fim).getTime() <= Date.now()) {
        await this.swal.alerta('A data de término já passou. Escolha uma data futura.', 'Datas inválidas');
        return;
      }
    }

    const conflito = this.conflitoAtual;
    if (conflito?.excede) {
      const nomes = conflito.sobrepostos.map((o) => `"${o.titulo}"`).join(', ');
      const continuar = await this.swal.confirmarAcao(
        `Nesse período já ficam no ar: ${nomes}. O bloco mostra no máximo ${this.limite} por vez, então só os de menor ordem aparecem. Salvar mesmo assim?`,
        'Conflito de datas',
        'Salvar mesmo assim',
      );
      if (!continuar) return;
    }

    const payload = this.montarPayload(v, inicio, fim);
    this.salvando = true;
    const req = this.editando
      ? this.api.atualizar<EspacoPatrocinadoAdmin>('espacos-patrocinados', this.editando.id, payload)
      : this.api.criar<EspacoPatrocinadoAdmin>('espacos-patrocinados', payload);

    req.subscribe({
      next: () => {
        this.salvando = false;
        this.form.markAsPristine();
        this.modalAberto = false;
        this.carregar();
        this.alterou.emit();
      },
      error: (e) => {
        this.salvando = false;
        const msg = typeof e?.error === 'string' && e.error.length < 200 ? e.error : 'Não foi possível salvar.';
        this.swal.erro(msg);
      },
    });
  }

  private montarPayload(v: ReturnType<typeof this.form.getRawValue>, inicio: string | null, fim: string | null): Record<string, unknown> {
    const base = this.editando;
    const ordem = base ? base.ordem : Math.max(0, ...this.itens.map((i) => i.ordem)) + 1;
    return {
      tipo: v.tipo,
      chamada: v.chamada.trim() || ROTULOS_TIPO[v.tipo] || 'Patrocínio',
      titulo: v.titulo.trim(),
      descricao: v.formato === 'banner' ? null : v.descricao.trim() || null,
      textoBotao: v.formato === 'banner' ? null : v.textoBotao.trim() || null,
      link: v.link.trim(),
      imagemUrl: v.imagemUrl || null,
      logoUrl: v.formato === 'banner' ? null : v.logoUrl || null,
      tema: v.formato === 'banner' ? 'Banner' : v.tema,
      tamanho: v.tamanho,
      corFundo: v.formato === 'card' && v.tema === 'Brand' && ehCorValida(v.corFundo) ? v.corFundo : null,
      larguraPx: base?.larguraPx ?? null,
      alturaPx: base?.alturaPx ?? null,
      rotuloSite: base?.rotuloSite ?? null,
      externo: v.externo,
      paginaExibicao: base?.paginaExibicao ?? null,
      ordem,
      ativo: v.ativo,
      dataInicioVigencia: inicio,
      dataFimVigencia: fim,
    };
  }

  // ---- Ações da lista ----

  private payloadDe(item: EspacoPatrocinadoAdmin, mudancas: Partial<EspacoPatrocinadoAdmin> = {}): Record<string, unknown> {
    const i = { ...item, ...mudancas };
    return {
      tipo: i.tipo,
      chamada: i.chamada,
      titulo: i.titulo,
      descricao: i.descricao ?? null,
      textoBotao: i.textoBotao ?? null,
      link: i.link,
      imagemUrl: i.imagemUrl ?? null,
      logoUrl: i.logoUrl ?? null,
      tema: i.tema,
      tamanho: i.tamanho,
      corFundo: i.corFundo ?? null,
      larguraPx: i.larguraPx ?? null,
      alturaPx: i.alturaPx ?? null,
      rotuloSite: i.rotuloSite ?? null,
      externo: i.externo,
      paginaExibicao: i.paginaExibicao ?? null,
      ordem: i.ordem,
      ativo: i.ativo,
      dataInicioVigencia: i.dataInicioVigencia ?? null,
      dataFimVigencia: i.dataFimVigencia ?? null,
    };
  }

  alternarVisivel(item: EspacoPatrocinadoAdmin, evento: Event): void {
    evento.stopPropagation();
    const ativo = !item.ativo;
    this.api.atualizar('espacos-patrocinados', item.id, this.payloadDe(item, { ativo })).subscribe({
      next: () => {
        item.ativo = ativo;
        this.alterou.emit();
      },
      error: () => this.swal.erro('Não foi possível alterar a visibilidade.'),
    });
  }

  async excluir(item: EspacoPatrocinadoAdmin, evento: Event): Promise<void> {
    evento.stopPropagation();
    const ok = await this.swal.confirmarExclusao(`Excluir "${item.titulo}"? Se só quiser tirar do ar por um tempo, use o olhinho.`);
    if (!ok) return;
    this.api.excluir('espacos-patrocinados', item.id).subscribe({
      next: () => {
        this.carregar();
        this.alterou.emit();
      },
      error: () => this.swal.erro('Não foi possível excluir.'),
    });
  }

  soltar(evento: CdkDragDrop<EspacoPatrocinadoAdmin[]>): void {
    const lista = [...this.itens];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.itens = lista;
    lista.forEach((item, indice) => {
      const ordem = indice + 1;
      if (item.ordem === ordem) return;
      item.ordem = ordem;
      this.api.atualizar('espacos-patrocinados', item.id, this.payloadDe(item)).subscribe();
    });
    this.alterou.emit();
  }
}
