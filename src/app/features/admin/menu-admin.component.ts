import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { LinkVinculoComponent } from '../../shared/components/link-vinculo/link-vinculo.component';
import { ArtigoAdmin, CategoriaAdmin } from '../../core/models/admin.model';

interface ItemMenu {
  id: number;
  label: string;
  href: string;
  ordem: number;
  ativo: boolean;
}

interface LinkMenu {
  id: number;
  menuItemId: number;
  colunaTitulo: string | null;
  label: string;
  href: string;
  ordem: number;
  ativo: boolean;
}

interface Coluna {
  titulo: string;
  links: LinkMenu[];
}

interface PaginaResumo {
  id: number;
  titulo: string;
  slug: string;
}

const NOVA_COLUNA = '__nova__';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, DragDropModule, LinkVinculoComponent],
  templateUrl: './menu-admin.component.html',
  styleUrl: './menu-admin.component.scss',
})
export class MenuAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);

  readonly NOVA_COLUNA = NOVA_COLUNA;

  carregando = true;
  erro: string | null = null;
  salvando = false;

  itens: ItemMenu[] = [];
  private links: LinkMenu[] = [];
  artigos: ArtigoAdmin[] = [];
  paginas: PaginaResumo[] = [];
  categorias: CategoriaAdmin[] = [];

  itemSelecionadoId: number | null = null;
  criandoItem = false;

  colunas: Coluna[] = [];
  private colunasVazias: string[] = [];

  editandoLink = false;
  linkEmEdicaoId: number | null = null;

  formItem = this.fb.nonNullable.group({
    label: ['', Validators.required],
    href: [''],
    soAbreSubmenu: [false],
  });

  formLink = this.fb.nonNullable.group({
    label: ['', Validators.required],
    href: ['', Validators.required],
    coluna: [''],
    novaColuna: [''],
  });

  ngOnInit(): void {
    this.carregar();
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => (this.artigos = artigos));
    this.api.listar<PaginaResumo>('paginas-institucionais').subscribe((paginas) => (this.paginas = paginas));
    this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => (this.categorias = categorias));
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formItem.dirty || this.formLink.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  get itemSelecionado(): ItemMenu | null {
    return this.itens.find((i) => i.id === this.itemSelecionadoId) ?? null;
  }

  get itemTemSubmenu(): boolean {
    return this.colunas.some((c) => c.links.length > 0);
  }

  get titulosColunasExistentes(): string[] {
    return this.colunas.map((c) => c.titulo).filter((t) => t);
  }

  get hrefDoItemEhSubmenu(): boolean {
    return this.formItem.value.soAbreSubmenu === true;
  }

  private carregar(selecionarId?: number | null): void {
    this.carregando = true;
    forkJoin({
      itens: this.api.listar<ItemMenu>('menu-itens'),
      links: this.api.listar<LinkMenu>('menu-links'),
    }).subscribe({
      next: ({ itens, links }) => {
        this.itens = itens.sort((a, b) => a.ordem - b.ordem);
        this.links = links;
        this.carregando = false;

        const alvo = selecionarId === undefined ? this.itemSelecionadoId : selecionarId;
        const existente = this.itens.find((i) => i.id === alvo) ?? this.itens[0] ?? null;
        if (existente) this.selecionarItem(existente);
        else this.novoItem();
      },
      error: () => {
        this.erro = 'Não foi possível carregar o menu.';
        this.carregando = false;
      },
    });
  }

  // ---- Itens do menu (a barra do topo) ----

  selecionarItem(item: ItemMenu): void {
    this.itemSelecionadoId = item.id;
    this.criandoItem = false;
    this.fecharEdicaoLink();
    this.colunasVazias = [];
    this.formItem.reset({ label: item.label, href: item.href === '#' ? '' : item.href, soAbreSubmenu: item.href === '#' });
    this.reconstruirColunas();
  }

  novoItem(): void {
    this.itemSelecionadoId = null;
    this.criandoItem = true;
    this.fecharEdicaoLink();
    this.colunas = [];
    this.colunasVazias = [];
    this.formItem.reset({ label: '', href: '', soAbreSubmenu: false });
  }

  salvarItem(): void {
    if (this.formItem.invalid) return;

    const { label, href, soAbreSubmenu } = this.formItem.getRawValue();
    const destino = soAbreSubmenu ? '#' : href.trim();
    if (!destino) {
      this.swal.alerta('Informe pra onde esse item leva, ou marque "só abre o submenu".', 'Falta o destino');
      return;
    }

    const existente = this.itemSelecionado;
    const payload = { label: label.trim(), href: destino, ordem: existente?.ordem ?? this.itens.length + 1 };

    this.salvando = true;
    const requisicao = existente
      ? this.api.atualizar<ItemMenu>('menu-itens', existente.id, payload)
      : this.api.criar<ItemMenu>('menu-itens', payload);

    requisicao.subscribe({
      next: (salvo) => {
        this.salvando = false;
        this.formItem.markAsPristine();
        this.carregar(salvo.id);
      },
      error: (e) => this.falhar(e, 'Não foi possível salvar o item do menu.'),
    });
  }

  async excluirItem(): Promise<void> {
    const item = this.itemSelecionado;
    if (!item) return;

    const quantidade = this.links.filter((l) => l.menuItemId === item.id).length;
    const aviso = quantidade
      ? `Excluir "${item.label}" e os ${quantidade} link(s) do submenu dele? Isso tira o item do menu do site.`
      : `Excluir "${item.label}" do menu do site?`;
    if (!(await this.swal.confirmarExclusao(aviso))) return;

    const exclusoes = this.links.filter((l) => l.menuItemId === item.id).map((l) => this.api.excluir('menu-links', l.id));
    forkJoin([...exclusoes, this.api.excluir('menu-itens', item.id)]).subscribe({
      next: () => {
        this.itemSelecionadoId = null;
        this.carregar(null);
      },
      error: (e) => this.falhar(e, 'Não foi possível excluir o item.'),
    });
  }

  soltarItem(evento: CdkDragDrop<ItemMenu[]>): void {
    const lista = [...this.itens];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.itens = lista;

    lista.forEach((item, indice) => {
      const ordem = indice + 1;
      if (item.ordem === ordem) return;
      item.ordem = ordem;
      this.api.atualizar('menu-itens', item.id, { label: item.label, href: item.href, ordem }).subscribe();
    });
  }

  /** Esconde (ou volta a mostrar) o item no site, sem excluir. */
  alternarVisivelItem(item: ItemMenu, evento: Event): void {
    evento.stopPropagation();
    const ativo = !item.ativo;
    this.api.atualizar('menu-itens', item.id, { label: item.label, href: item.href, ordem: item.ordem, ativo }).subscribe(() => (item.ativo = ativo));
  }

  alternarVisivelLink(link: LinkMenu): void {
    const ativo = !link.ativo;
    this.api.atualizar('menu-links', link.id, { ...this.payloadLink(link), ativo }).subscribe(() => (link.ativo = ativo));
  }

  // ---- Colunas e links do submenu ----

  private reconstruirColunas(): void {
    const item = this.itemSelecionado;
    if (!item) {
      this.colunas = [];
      return;
    }

    const doItem = this.links.filter((l) => l.menuItemId === item.id).sort((a, b) => a.ordem - b.ordem);
    const mapa = new Map<string, LinkMenu[]>();
    for (const link of doItem) {
      const titulo = link.colunaTitulo ?? '';
      if (!mapa.has(titulo)) mapa.set(titulo, []);
      mapa.get(titulo)!.push(link);
    }

    const colunas: Coluna[] = [...mapa.entries()].map(([titulo, links]) => ({ titulo, links }));
    for (const titulo of this.colunasVazias) {
      if (!mapa.has(titulo)) colunas.push({ titulo, links: [] });
    }
    this.colunas = colunas;
  }

  adicionarColuna(): void {
    let numero = this.colunas.length + 1;
    let titulo = `Coluna ${numero}`;
    while (this.colunas.some((c) => c.titulo === titulo)) titulo = `Coluna ${++numero}`;

    this.colunasVazias = [...this.colunasVazias, titulo];
    this.reconstruirColunas();
  }

  renomearColuna(coluna: Coluna, novoTitulo: string): void {
    const titulo = novoTitulo.trim();
    if (titulo === coluna.titulo) return;
    if (this.colunas.some((c) => c !== coluna && c.titulo === titulo)) {
      this.swal.alerta('Já existe uma coluna com esse título neste item.', 'Título repetido');
      this.reconstruirColunas();
      return;
    }

    this.colunasVazias = this.colunasVazias.map((t) => (t === coluna.titulo ? titulo : t));
    coluna.links.forEach((link) => {
      link.colunaTitulo = titulo || null;
      this.api.atualizar('menu-links', link.id, this.payloadLink(link)).subscribe();
    });
    coluna.titulo = titulo;
  }

  async excluirColuna(coluna: Coluna): Promise<void> {
    if (coluna.links.length) {
      const ok = await this.swal.confirmarExclusao(`Excluir a coluna "${coluna.titulo || 'sem título'}" e os ${coluna.links.length} link(s) dela?`);
      if (!ok) return;
      forkJoin(coluna.links.map((l) => this.api.excluir('menu-links', l.id))).subscribe(() => this.recarregarLinks());
    } else {
      this.colunasVazias = this.colunasVazias.filter((t) => t !== coluna.titulo);
      this.reconstruirColunas();
    }
  }

  moverColuna(indice: number, direcao: -1 | 1): void {
    const destino = indice + direcao;
    if (destino < 0 || destino >= this.colunas.length) return;

    const colunas = [...this.colunas];
    moveItemInArray(colunas, indice, destino);
    this.colunas = colunas;
    this.persistirOrdemLinks();
  }

  soltarLink(evento: CdkDragDrop<LinkMenu[]>, colunaDestino: Coluna): void {
    if (evento.previousContainer === evento.container) {
      moveItemInArray(colunaDestino.links, evento.previousIndex, evento.currentIndex);
    } else {
      transferArrayItem(evento.previousContainer.data, colunaDestino.links, evento.previousIndex, evento.currentIndex);
      colunaDestino.links[evento.currentIndex].colunaTitulo = colunaDestino.titulo || null;
    }
    this.persistirOrdemLinks();
  }

  private persistirOrdemLinks(): void {
    let contador = 1;
    for (const coluna of this.colunas) {
      for (const link of coluna.links) {
        const ordem = contador++;
        const tituloAlvo = coluna.titulo || null;
        if (link.ordem === ordem && link.colunaTitulo === tituloAlvo) continue;
        link.ordem = ordem;
        link.colunaTitulo = tituloAlvo;
        this.api.atualizar('menu-links', link.id, this.payloadLink(link)).subscribe();
      }
    }
  }

  private payloadLink(link: LinkMenu): Record<string, unknown> {
    return { menuItemId: link.menuItemId, colunaTitulo: link.colunaTitulo, label: link.label, href: link.href, ordem: link.ordem };
  }

  private recarregarLinks(): void {
    this.api.listar<LinkMenu>('menu-links').subscribe((links) => {
      this.links = links;
      this.reconstruirColunas();
    });
  }

  // ---- Formulário de link ----

  novoLink(coluna?: Coluna): void {
    this.editandoLink = true;
    this.linkEmEdicaoId = null;
    this.formLink.reset({ label: '', href: '', coluna: coluna ? coluna.titulo : this.colunas[0]?.titulo ?? NOVA_COLUNA, novaColuna: '' });
    if (!this.colunas.length) this.formLink.patchValue({ coluna: NOVA_COLUNA });
  }

  editarLink(link: LinkMenu): void {
    this.editandoLink = true;
    this.linkEmEdicaoId = link.id;
    this.formLink.reset({ label: link.label, href: link.href, coluna: link.colunaTitulo ?? '', novaColuna: '' });
  }

  fecharEdicaoLink(): void {
    this.editandoLink = false;
    this.linkEmEdicaoId = null;
    this.formLink.reset({ label: '', href: '', coluna: '', novaColuna: '' });
  }

  salvarLink(): void {
    const item = this.itemSelecionado;
    if (!item || this.formLink.invalid) return;

    const { label, href, coluna, novaColuna } = this.formLink.getRawValue();
    const titulo = coluna === NOVA_COLUNA ? novaColuna.trim() : coluna;

    const existente = this.links.find((l) => l.id === this.linkEmEdicaoId);
    const ordem = existente ? existente.ordem : this.links.reduce((max, l) => Math.max(max, l.ordem), 0) + 1;
    const payload = { menuItemId: item.id, colunaTitulo: titulo || null, label: label.trim(), href: href.trim(), ordem };

    this.salvando = true;
    const requisicao = existente
      ? this.api.atualizar<LinkMenu>('menu-links', existente.id, payload)
      : this.api.criar<LinkMenu>('menu-links', payload);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.colunasVazias = this.colunasVazias.filter((t) => t !== titulo);
        this.fecharEdicaoLink();
        this.recarregarLinks();
      },
      error: (e) => this.falhar(e, 'Não foi possível salvar o link.'),
    });
  }

  async excluirLink(link: LinkMenu): Promise<void> {
    if (!(await this.swal.confirmarExclusao(`Excluir o link "${link.label}"?`))) return;
    this.api.excluir('menu-links', link.id).subscribe(() => {
      if (this.linkEmEdicaoId === link.id) this.fecharEdicaoLink();
      this.recarregarLinks();
    });
  }

  // ---- Vincular a conteúdo existente (artigo/página/tópico) ----

  vincular(destino: 'item' | 'link', caminho: string): void {
    const form = destino === 'item' ? this.formItem : this.formLink;
    form.patchValue({ href: caminho });
    form.markAsDirty();
  }

  tituloColuna(coluna: Coluna): string {
    return coluna.titulo || 'Sem título';
  }

  private falhar(erro: unknown, mensagemPadrao: string): void {
    this.salvando = false;
    const detalhe = erro instanceof HttpErrorResponse && typeof erro.error === 'string' ? erro.error : mensagemPadrao;
    this.swal.erro(detalhe);
  }
}
