import { Component, HostListener, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

export interface CampoLista {
  chave: string;
  rotulo: string;
  dica?: string;
  placeholder?: string;
  obrigatorio?: boolean;
}

export interface ConfigLista {
  /** Rota da API admin (ex: 'especialidades'). */
  recurso: string;
  /** Como chamar um item no singular, em minúsculas (ex: 'especialidade'). */
  rotuloItem: string;
  explicacao: string;
  campos: CampoLista[];
  /** Campo exibido como título de cada linha. */
  campoTitulo: string;
  /** Campos exibidos em letra pequena abaixo do título. */
  camposSubtitulo?: string[];
  /** Se os itens têm "ordem" e podem ser arrastados. */
  reordenavel: boolean;
}

type Item = { id: number; ativo: boolean; ordem?: number } & Record<string, unknown>;

/** Lista de cadastro simples e reutilizável: adicionar, editar, esconder (olhinho), excluir e, quando há ordem, arrastar. */
@Component({
  selector: 'app-lista-cadastro-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './lista-cadastro-admin.component.html',
  styleUrl: './lista-cadastro-admin.component.scss',
})
export class ListaCadastroAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);

  @Input({ required: true }) config!: ConfigLista;

  carregando = true;
  erro: string | null = null;
  salvando = false;
  busca = '';

  itens: Item[] = [];
  editando = false;
  editandoId: number | null = null;

  form: FormGroup = this.fb.group({});

  ngOnInit(): void {
    const controles: Record<string, FormControl> = {};
    for (const campo of this.config.campos) {
      controles[campo.chave] = new FormControl('', campo.obrigatorio ? Validators.required : null);
    }
    this.form = this.fb.group(controles);
    this.carregar();
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

  get itensFiltrados(): Item[] {
    const termo = this.busca.trim().toLowerCase();
    if (!termo) return this.itens;
    return this.itens.filter((i) => this.config.campos.some((c) => String(i[c.chave] ?? '').toLowerCase().includes(termo)));
  }

  get podeArrastar(): boolean {
    return this.config.reordenavel && !this.busca.trim();
  }

  titulo(item: Item): string {
    return String(item[this.config.campoTitulo] ?? '');
  }

  subtitulo(item: Item): string {
    if (!item.ativo) return 'Escondido do site';
    return (this.config.camposSubtitulo ?? [])
      .map((chave) => item[chave])
      .filter((v) => v !== null && v !== undefined && v !== '')
      .join(' · ');
  }

  private carregar(): void {
    this.carregando = true;
    this.api.listar<Item>(this.config.recurso).subscribe({
      next: (itens) => {
        this.itens = this.config.reordenavel ? [...itens].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)) : itens;
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
    this.form.reset(Object.fromEntries(this.config.campos.map((c) => [c.chave, ''])));
  }

  editar(item: Item): void {
    this.editando = true;
    this.editandoId = item.id;
    this.form.reset(Object.fromEntries(this.config.campos.map((c) => [c.chave, item[c.chave] ?? ''])));
  }

  fechar(): void {
    this.editando = false;
    this.editandoId = null;
    this.form.reset();
  }

  private payload(item: Partial<Item> | null, valores: Record<string, unknown>, ordem: number): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...valores };
    if (this.config.reordenavel) payload['ordem'] = ordem;
    return payload;
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue() as Record<string, unknown>;
    for (const campo of this.config.campos) {
      if (typeof valores[campo.chave] === 'string') valores[campo.chave] = (valores[campo.chave] as string).trim();
    }

    const existente = this.itens.find((i) => i.id === this.editandoId) ?? null;
    const ordem = existente?.ordem ?? this.itens.reduce((max, i) => Math.max(max, i.ordem ?? 0), 0) + 1;
    const payload = this.payload(existente, valores, ordem);

    this.salvando = true;
    const requisicao = existente
      ? this.api.atualizar<Item>(this.config.recurso, existente.id, payload)
      : this.api.criar<Item>(this.config.recurso, payload);

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

  private valoresDe(item: Item): Record<string, unknown> {
    return Object.fromEntries(this.config.campos.map((c) => [c.chave, item[c.chave] ?? '']));
  }

  /** Esconde (ou volta a mostrar) o item, sem excluir. */
  alternarVisivel(item: Item): void {
    const ativo = !item.ativo;
    const payload = { ...this.payload(item, this.valoresDe(item), item.ordem ?? 0), ativo };
    this.api.atualizar(this.config.recurso, item.id, payload).subscribe(() => (item.ativo = ativo));
  }

  async excluir(item: Item): Promise<void> {
    if (!(await this.swal.confirmarExclusao(`Excluir "${this.titulo(item)}"?`))) return;
    this.api.excluir(this.config.recurso, item.id).subscribe(() => {
      if (this.editandoId === item.id) this.fechar();
      this.carregar();
    });
  }

  soltar(evento: CdkDragDrop<Item[]>): void {
    const lista = [...this.itens];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.itens = lista;

    lista.forEach((item, indice) => {
      const ordem = indice + 1;
      if (item.ordem === ordem) return;
      item.ordem = ordem;
      this.api.atualizar(this.config.recurso, item.id, this.payload(item, this.valoresDe(item), ordem)).subscribe();
    });
  }
}
