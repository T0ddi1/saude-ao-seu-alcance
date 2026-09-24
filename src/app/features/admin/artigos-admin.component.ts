import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UploadService } from '../../core/services/upload.service';
import { SwalService } from '../../core/services/swal.service';
import { ArtigoAdmin, ArtigoSalvar, CategoriaAdmin } from '../../core/models/admin.model';
import { QuillEditorComponent } from '../../shared/components/quill-editor/quill-editor.component';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

@Component({
  selector: 'app-artigos-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './artigos-admin.component.html',
  styleUrl: './artigos-admin.component.scss',
})
export class ArtigosAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private swal = inject(SwalService);
  private sanitizer = inject(DomSanitizer);

  artigos: ArtigoAdmin[] = [];
  categorias: CategoriaAdmin[] = [];
  editandoId: number | null = null;
  carregando = false;
  erro: string | null = null;
  enviandoCapa = false;
  abaAtiva: 'editar' | 'preview' = 'editar';

  formulario = this.fb.group({
    titulo: ['', Validators.required],
    resumo: ['', Validators.required],
    conteudoHtml: ['', Validators.required],
    imagemCapaUrl: [''],
    categoriaId: [null as number | null, Validators.required],
    autorExibicao: [''],
    autorCargo: [''],
    destaque: [false],
  });

  ngOnInit(): void {
    this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => (this.categorias = categorias));
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;
    this.api.listar<ArtigoAdmin>('artigos').subscribe({
      next: (artigos) => {
        this.artigos = artigos;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os artigos.';
        this.carregando = false;
      },
    });
  }

  editar(artigo: ArtigoAdmin): void {
    this.editandoId = artigo.id;
    this.formulario.patchValue({
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      conteudoHtml: artigo.conteudoHtml,
      imagemCapaUrl: artigo.imagemCapaUrl ?? '',
      categoriaId: artigo.categoriaId ?? null,
      autorExibicao: artigo.autorExibicao ?? '',
      autorCargo: artigo.autorCargo ?? '',
      destaque: artigo.destaque,
    });
    this.abaAtiva = 'editar';
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formulario.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  cancelarEdicao(): void {
    this.editandoId = null;
    this.formulario.reset({ destaque: false, categoriaId: null });
    this.abaAtiva = 'editar';
  }

  selecionarCapa(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviandoCapa = true;
    this.uploadService.enviar(arquivo).subscribe({
      next: (url) => {
        this.formulario.patchValue({ imagemCapaUrl: url });
        this.enviandoCapa = false;
      },
      error: () => {
        this.erro = 'Não foi possível enviar a imagem de capa.';
        this.enviandoCapa = false;
      },
    });
    input.value = '';
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.erro = 'Preencha título, resumo, conteúdo e o tópico/categoria antes de salvar.';
      return;
    }

    const payload = this.formulario.getRawValue() as ArtigoSalvar;
    const requisicao = this.editandoId
      ? this.api.atualizar<ArtigoAdmin>('artigos', this.editandoId, payload)
      : this.api.criar<ArtigoAdmin>('artigos', payload);

    requisicao.subscribe({
      next: () => {
        this.cancelarEdicao();
        this.carregar();
      },
      error: () => (this.erro = 'Não foi possível salvar o artigo.'),
    });
  }

  alternarPublicacao(artigo: ArtigoAdmin): void {
    const acao = artigo.publicado ? 'despublicar' : 'publicar';
    this.api.acao<ArtigoAdmin>('artigos', artigo.id, acao).subscribe(() => this.carregar());
  }

  async excluir(artigo: ArtigoAdmin): Promise<void> {
    const ok = await this.swal.confirmarExclusao(`Excluir o artigo "${artigo.titulo}"?`);
    if (!ok) return;
    this.api.excluir('artigos', artigo.id).subscribe(() => this.carregar());
  }

  get categoriaNomeSelecionada(): string {
    const id = this.formulario.value.categoriaId;
    return this.categorias.find((c) => c.id === id)?.nome ?? '';
  }

  get conteudoPreview(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.formulario.value.conteudoHtml || '<p><em>Nada escrito ainda.</em></p>');
  }
}
