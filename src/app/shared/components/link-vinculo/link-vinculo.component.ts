import { Component, ElementRef, EventEmitter, HostListener, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OpcaoArtigo {
  id: number;
  titulo: string;
  slug: string;
  categoriaSlug?: string | null;
}
export interface OpcaoPagina {
  id: number;
  titulo: string;
  slug: string;
}
export interface OpcaoCategoria {
  id: number;
  nome: string;
  slug: string;
}

interface ItemGrupo {
  rotulo: string;
  caminho: string;
  artigoId?: number;
}
interface Grupo {
  titulo: string;
  itens: ItemGrupo[];
}

const normalizar = (texto: string): string =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

@Component({
  selector: 'app-link-vinculo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './link-vinculo.component.html',
  styleUrl: './link-vinculo.component.scss',
})
export class LinkVinculoComponent {
  private elemento = inject(ElementRef<HTMLElement>);

  @Input() artigos: OpcaoArtigo[] = [];
  @Input() paginas: OpcaoPagina[] = [];
  @Input() categorias: OpcaoCategoria[] = [];
  /** 'link': escolhe artigo, página ou tópico e emite o caminho. 'artigo': só artigos, emite o id do artigo escolhido. */
  @Input() modo: 'link' | 'artigo' = 'link';
  @Input() rotulo = '↳ ou escolha um artigo, página ou tópico do site...';
  @Output() escolher = new EventEmitter<string>();
  @Output() escolherArtigo = new EventEmitter<number>();

  aberto = false;
  busca = '';

  get grupos(): Grupo[] {
    const termo = normalizar(this.busca.trim());
    const filtrar = (itens: ItemGrupo[]) => (termo ? itens.filter((i) => normalizar(i.rotulo).includes(termo)) : itens);

    const grupos: Grupo[] = [
      {
        titulo: 'Artigos',
        itens: filtrar(this.artigos.map((a) => ({ rotulo: a.titulo, caminho: `/artigos/${a.categoriaSlug ?? 'geral'}/${a.slug}`, artigoId: a.id }))),
      },
      { titulo: 'Páginas institucionais', itens: filtrar(this.paginas.map((p) => ({ rotulo: p.titulo, caminho: `/${p.slug}` }))) },
      { titulo: 'Tópicos (categorias)', itens: filtrar(this.categorias.map((c) => ({ rotulo: c.nome, caminho: `/blog?categoria=${c.slug}` }))) },
    ];
    return grupos.filter((g) => g.itens.length > 0 && (this.modo === 'link' || g.titulo === 'Artigos'));
  }

  alternar(): void {
    this.aberto = !this.aberto;
    this.busca = '';
  }

  selecionar(item: ItemGrupo): void {
    if (this.modo === 'artigo' && item.artigoId) this.escolherArtigo.emit(item.artigoId);
    else this.escolher.emit(item.caminho);
    this.aberto = false;
    this.busca = '';
  }

  @HostListener('document:click', ['$event'])
  fecharAoClicarFora(evento: MouseEvent): void {
    if (this.aberto && !this.elemento.nativeElement.contains(evento.target)) this.aberto = false;
  }

  @HostListener('document:keydown.escape')
  fecharComEsc(): void {
    this.aberto = false;
  }
}
