import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { forkJoin } from 'rxjs';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ArtigoAdmin, CategoriaAdmin } from '../../core/models/admin.model';
import { LinkVinculoComponent } from '../../shared/components/link-vinculo/link-vinculo.component';

interface LinkRodape {
  id: number;
  coluna: string;
  label: string;
  href: string;
  ordem: number;
  ativo: boolean;
}

interface Coluna {
  nome: string;
  links: LinkRodape[];
}

interface PaginaResumo {
  id: number;
  titulo: string;
  slug: string;
}

const NOVA_COLUNA = '__nova__';

@Component({
  selector: 'app-rodape-links-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, LinkVinculoComponent],
  templateUrl: './rodape-links-admin.component.html',
  styleUrl: './rodape-links-admin.component.scss',
})
export class RodapeLinksAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);

  readonly NOVA_COLUNA = NOVA_COLUNA;

  @Input() embutido = false;

  carregando = true;
  erro: string | null = null;
  salvando = false;

  colunas: Coluna[] = [];
  private links: LinkRodape[] = [];
  private colunasVazias: string[] = [];

  artigos: ArtigoAdmin[] = [];
  paginas: PaginaResumo[] = [];
  categorias: CategoriaAdmin[] = [];

  editando = false;
  linkEmEdicaoId: number | null = null;

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
    return this.formLink.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  get nomesColunas(): string[] {
    return this.colunas.map((c) => c.nome);
  }

  private carregar(): void {
    this.carregando = true;
    this.api.listar<LinkRodape>('footer-links').subscribe({
      next: (links) => {
        this.links = links;
        this.reconstruir();
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os links do rodapé.';
        this.carregando = false;
      },
    });
  }

  private reconstruir(): void {
    const mapa = new Map<string, LinkRodape[]>();
    for (const link of [...this.links].sort((a, b) => a.ordem - b.ordem)) {
      if (!mapa.has(link.coluna)) mapa.set(link.coluna, []);
      mapa.get(link.coluna)!.push(link);
    }

    const colunas: Coluna[] = [...mapa.entries()].map(([nome, links]) => ({ nome, links }));
    for (const nome of this.colunasVazias) {
      if (!mapa.has(nome)) colunas.push({ nome, links: [] });
    }
    this.colunas = colunas;
  }

  // ---- Colunas ----

  adicionarColuna(): void {
    let numero = this.colunas.length + 1;
    let nome = `Coluna ${numero}`;
    while (this.colunas.some((c) => c.nome === nome)) nome = `Coluna ${++numero}`;

    this.colunasVazias = [...this.colunasVazias, nome];
    this.reconstruir();
  }

  renomearColuna(coluna: Coluna, novoNome: string): void {
    const nome = novoNome.trim();
    if (!nome) {
      this.reconstruir();
      return;
    }
    if (nome === coluna.nome) return;
    if (this.colunas.some((c) => c !== coluna && c.nome === nome)) {
      this.swal.alerta('Já existe uma coluna com esse nome.', 'Nome repetido');
      this.reconstruir();
      return;
    }

    this.colunasVazias = this.colunasVazias.map((n) => (n === coluna.nome ? nome : n));
    coluna.links.forEach((link) => {
      link.coluna = nome;
      this.api.atualizar('footer-links', link.id, this.payload(link)).subscribe();
    });
    coluna.nome = nome;
  }

  async excluirColuna(coluna: Coluna): Promise<void> {
    if (!coluna.links.length) {
      this.colunasVazias = this.colunasVazias.filter((n) => n !== coluna.nome);
      this.reconstruir();
      return;
    }

    const ok = await this.swal.confirmarExclusao(`Excluir a coluna "${coluna.nome}" e os ${coluna.links.length} link(s) dela?`);
    if (!ok) return;
    forkJoin(coluna.links.map((l) => this.api.excluir('footer-links', l.id))).subscribe(() => this.carregar());
  }

  moverColuna(indice: number, direcao: -1 | 1): void {
    const destino = indice + direcao;
    if (destino < 0 || destino >= this.colunas.length) return;

    const colunas = [...this.colunas];
    moveItemInArray(colunas, indice, destino);
    this.colunas = colunas;
    this.persistirOrdem();
  }

  soltarLink(evento: CdkDragDrop<LinkRodape[]>, destino: Coluna): void {
    if (evento.previousContainer === evento.container) {
      moveItemInArray(destino.links, evento.previousIndex, evento.currentIndex);
    } else {
      transferArrayItem(evento.previousContainer.data, destino.links, evento.previousIndex, evento.currentIndex);
    }
    this.persistirOrdem();
  }

  private persistirOrdem(): void {
    let contador = 1;
    for (const coluna of this.colunas) {
      for (const link of coluna.links) {
        const ordem = contador++;
        if (link.ordem === ordem && link.coluna === coluna.nome) continue;
        link.ordem = ordem;
        link.coluna = coluna.nome;
        this.api.atualizar('footer-links', link.id, this.payload(link)).subscribe();
      }
    }
  }

  private payload(link: LinkRodape): Record<string, unknown> {
    return { coluna: link.coluna, label: link.label, href: link.href, ordem: link.ordem };
  }

  /** Esconde (ou volta a mostrar) o link no site, sem excluir. */
  alternarVisivel(link: LinkRodape): void {
    const ativo = !link.ativo;
    this.api.atualizar('footer-links', link.id, { ...this.payload(link), ativo }).subscribe(() => (link.ativo = ativo));
  }

  // ---- Links ----

  novoLink(coluna?: Coluna): void {
    this.editando = true;
    this.linkEmEdicaoId = null;
    this.formLink.reset({ label: '', href: '', coluna: coluna?.nome ?? this.colunas[0]?.nome ?? NOVA_COLUNA, novaColuna: '' });
  }

  editarLink(link: LinkRodape): void {
    this.editando = true;
    this.linkEmEdicaoId = link.id;
    this.formLink.reset({ label: link.label, href: link.href, coluna: link.coluna, novaColuna: '' });
  }

  fecharEdicao(): void {
    this.editando = false;
    this.linkEmEdicaoId = null;
    this.formLink.reset({ label: '', href: '', coluna: '', novaColuna: '' });
  }

  vincular(caminho: string): void {
    this.formLink.patchValue({ href: caminho });
    this.formLink.markAsDirty();
  }

  salvarLink(): void {
    if (this.formLink.invalid) return;

    const { label, href, coluna, novaColuna } = this.formLink.getRawValue();
    const nomeColuna = coluna === NOVA_COLUNA ? novaColuna.trim() : coluna;
    if (!nomeColuna) {
      this.swal.alerta('Escolha uma coluna ou dê um nome pra nova coluna.', 'Falta a coluna');
      return;
    }

    const existente = this.links.find((l) => l.id === this.linkEmEdicaoId);
    const ordem = existente ? existente.ordem : this.links.reduce((max, l) => Math.max(max, l.ordem), 0) + 1;
    const payload = { coluna: nomeColuna, label: label.trim(), href: href.trim(), ordem };

    this.salvando = true;
    const requisicao = existente
      ? this.api.atualizar<LinkRodape>('footer-links', existente.id, payload)
      : this.api.criar<LinkRodape>('footer-links', payload);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.colunasVazias = this.colunasVazias.filter((n) => n !== nomeColuna);
        this.fecharEdicao();
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => {
        this.salvando = false;
        this.swal.erro(typeof erro.error === 'string' ? erro.error : 'Não foi possível salvar o link.');
      },
    });
  }

  async excluirLink(link: LinkRodape): Promise<void> {
    if (!(await this.swal.confirmarExclusao(`Excluir o link "${link.label}"?`))) return;
    this.api.excluir('footer-links', link.id).subscribe(() => {
      if (this.linkEmEdicaoId === link.id) this.fecharEdicao();
      this.carregar();
    });
  }
}
