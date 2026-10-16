import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ArtigoAdmin, CategoriaAdmin } from '../../core/models/admin.model';
import { IconPickerComponent } from '../../shared/components/icon-picker/icon-picker.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { LinkVinculoComponent } from '../../shared/components/link-vinculo/link-vinculo.component';

interface ItemRodape {
  id: number;
  icone: string;
  label?: string;
  titulo?: string;
  descricao?: string;
  href: string;
  ordem: number;
  ativo: boolean;
}

interface PaginaResumo {
  id: number;
  titulo: string;
  slug: string;
}

/** Lista simples e reordenável do rodapé (redes sociais ou projetos especiais): ícone + nome + link, e opcionalmente uma descrição. */
@Component({
  selector: 'app-rodape-lista-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule, IconPickerComponent, IconComponent, LinkVinculoComponent],
  templateUrl: './rodape-lista-admin.component.html',
  styleUrl: './rodape-lista-admin.component.scss',
})
export class RodapeListaAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);

  /** Rota da API: 'footer-redes-sociais' ou 'footer-projetos-especiais'. */
  @Input({ required: true }) recurso!: string;
  /** Campo que guarda o nome do item na API ('label' nas redes, 'titulo' nos projetos). */
  @Input() campoNome: 'label' | 'titulo' = 'titulo';
  @Input() rotuloNome = 'Nome';
  @Input() rotuloItem = 'item';
  @Input() comDescricao = false;
  @Input() comLinkInterno = true;
  @Input() explicacao = '';

  carregando = true;
  erro: string | null = null;
  salvando = false;

  itens: ItemRodape[] = [];
  artigos: ArtigoAdmin[] = [];
  paginas: PaginaResumo[] = [];
  categorias: CategoriaAdmin[] = [];

  editando = false;
  editandoId: number | null = null;

  form = this.fb.nonNullable.group({
    icone: ['', Validators.required],
    nome: ['', Validators.required],
    descricao: [''],
    href: ['', Validators.required],
  });

  ngOnInit(): void {
    this.carregar();
    if (this.comLinkInterno) {
      this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => (this.artigos = artigos));
      this.api.listar<PaginaResumo>('paginas-institucionais').subscribe((paginas) => (this.paginas = paginas));
      this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => (this.categorias = categorias));
    }
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.form.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  nomeDe(item: ItemRodape): string {
    return (this.campoNome === 'label' ? item.label : item.titulo) ?? '';
  }

  private carregar(): void {
    this.carregando = true;
    this.api.listar<ItemRodape>(this.recurso).subscribe({
      next: (itens) => {
        this.itens = itens.sort((a, b) => a.ordem - b.ordem);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a lista.';
        this.carregando = false;
      },
    });
  }

  novo(): void {
    this.editando = true;
    this.editandoId = null;
    this.form.reset({ icone: '', nome: '', descricao: '', href: '' });
  }

  editar(item: ItemRodape): void {
    this.editando = true;
    this.editandoId = item.id;
    this.form.reset({ icone: item.icone, nome: this.nomeDe(item), descricao: item.descricao ?? '', href: item.href });
  }

  fechar(): void {
    this.editando = false;
    this.editandoId = null;
    this.form.reset({ icone: '', nome: '', descricao: '', href: '' });
  }

  vincular(caminho: string): void {
    this.form.patchValue({ href: caminho });
    this.form.markAsDirty();
  }

  private payloadDe(icone: string, nome: string, descricao: string, href: string, ordem: number): Record<string, unknown> {
    const payload: Record<string, unknown> = { icone, href, ordem };
    payload[this.campoNome] = nome;
    if (this.comDescricao) payload['descricao'] = descricao;
    return payload;
  }

  salvar(): void {
    if (this.form.invalid) return;

    const v = this.form.getRawValue();
    const existente = this.itens.find((i) => i.id === this.editandoId);
    const ordem = existente ? existente.ordem : this.itens.reduce((max, i) => Math.max(max, i.ordem), 0) + 1;
    const payload = this.payloadDe(v.icone, v.nome.trim(), v.descricao, v.href.trim(), ordem);

    this.salvando = true;
    const requisicao = existente
      ? this.api.atualizar<ItemRodape>(this.recurso, existente.id, payload)
      : this.api.criar<ItemRodape>(this.recurso, payload);

    requisicao.subscribe({
      next: () => {
        this.salvando = false;
        this.fechar();
        this.carregar();
      },
      error: (erro: HttpErrorResponse) => {
        this.salvando = false;
        this.swal.erro(typeof erro.error === 'string' ? erro.error : 'Não foi possível salvar.');
      },
    });
  }

  /** Esconde (ou volta a mostrar) o item no site, sem excluir. */
  alternarVisivel(item: ItemRodape): void {
    const ativo = !item.ativo;
    const payload = { ...this.payloadDe(item.icone, this.nomeDe(item), item.descricao ?? '', item.href, item.ordem), ativo };
    this.api.atualizar(this.recurso, item.id, payload).subscribe(() => (item.ativo = ativo));
  }

  async excluir(item: ItemRodape): Promise<void> {
    if (!(await this.swal.confirmarExclusao(`Excluir "${this.nomeDe(item)}"?`))) return;
    this.api.excluir(this.recurso, item.id).subscribe(() => {
      if (this.editandoId === item.id) this.fechar();
      this.carregar();
    });
  }

  soltar(evento: CdkDragDrop<ItemRodape[]>): void {
    const lista = [...this.itens];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.itens = lista;

    lista.forEach((item, indice) => {
      const ordem = indice + 1;
      if (item.ordem === ordem) return;
      item.ordem = ordem;
      this.api.atualizar(this.recurso, item.id, this.payloadDe(item.icone, this.nomeDe(item), item.descricao ?? '', item.href, ordem)).subscribe();
    });
  }
}
