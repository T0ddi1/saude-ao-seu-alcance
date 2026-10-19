import { DicaImagemComponent } from '../../shared/components/dica-imagem/dica-imagem.component';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UploadService } from '../../core/services/upload.service';
import { SwalService } from '../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { QuillEditorComponent } from '../../shared/components/quill-editor/quill-editor.component';

interface PaginaAdmin {
  id: number;
  titulo: string;
  slug: string;
  resumoBusca: string;
  conteudoHtml: string;
  imagemUrl: string | null;
  anexoUrl: string | null;
  anexoLabel: string | null;
}

/** Páginas institucionais (Quem somos, Linha editorial, Política de privacidade...): lista à esquerda, editor com prévia à direita. */
@Component({
  selector: 'app-paginas-admin',
  standalone: true,
  imports: [DicaImagemComponent, CommonModule, ReactiveFormsModule, QuillEditorComponent],
  templateUrl: './paginas-admin.component.html',
  styleUrl: './paginas-admin.component.scss',
})
export class PaginasAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private upload = inject(UploadService);
  private swal = inject(SwalService);
  private sanitizer = inject(DomSanitizer);

  carregando = true;
  erro: string | null = null;
  salvando = false;
  enviando: Record<string, boolean> = {};

  paginas: PaginaAdmin[] = [];
  criando = false;
  editandoId: number | null = null;
  aba: 'editar' | 'previa' = 'editar';

  form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    resumoBusca: [''],
    imagemUrl: [''],
    conteudoHtml: ['', Validators.required],
    anexoUrl: [''],
    anexoLabel: [''],
  });

  ngOnInit(): void {
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

  get emEdicao(): boolean {
    return this.criando || this.editandoId !== null;
  }

  get paginaAtual(): PaginaAdmin | null {
    return this.paginas.find((p) => p.id === this.editandoId) ?? null;
  }

  get conteudoPrevia(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.form.value.conteudoHtml || '<p><em>Nada escrito ainda.</em></p>');
  }

  private carregar(selecionarId?: number): void {
    this.carregando = true;
    this.api.listar<PaginaAdmin>('paginas-institucionais').subscribe({
      next: (paginas) => {
        this.paginas = paginas.sort((a, b) => a.titulo.localeCompare(b.titulo));
        this.carregando = false;
        const alvo = this.paginas.find((p) => p.id === selecionarId);
        if (alvo) this.abrir(alvo);
      },
      error: () => {
        this.erro = 'Não foi possível carregar as páginas.';
        this.carregando = false;
      },
    });
  }

  private async confirmarDescarte(): Promise<boolean> {
    return !this.form.dirty || (await this.swal.confirmarSaidaComAlteracoes());
  }

  async selecionar(pagina: PaginaAdmin): Promise<void> {
    if (this.editandoId === pagina.id) return;
    if (!(await this.confirmarDescarte())) return;
    this.abrir(pagina);
  }

  private abrir(pagina: PaginaAdmin): void {
    this.criando = false;
    this.editandoId = pagina.id;
    this.aba = 'editar';
    this.form.reset({
      titulo: pagina.titulo,
      resumoBusca: pagina.resumoBusca ?? '',
      imagemUrl: pagina.imagemUrl ?? '',
      conteudoHtml: pagina.conteudoHtml ?? '',
      anexoUrl: pagina.anexoUrl ?? '',
      anexoLabel: pagina.anexoLabel ?? '',
    });
  }

  async nova(): Promise<void> {
    if (!(await this.confirmarDescarte())) return;
    this.criando = true;
    this.editandoId = null;
    this.aba = 'editar';
    this.form.reset({ titulo: '', resumoBusca: '', imagemUrl: '', conteudoHtml: '', anexoUrl: '', anexoLabel: '' });
  }

  async fechar(): Promise<void> {
    if (!(await this.confirmarDescarte())) return;
    this.criando = false;
    this.editandoId = null;
    this.form.reset();
  }

  enviarArquivo(evento: Event, campo: 'imagemUrl' | 'anexoUrl'): void {
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
        this.swal.erro('Não foi possível enviar o arquivo.');
      },
    });
    input.value = '';
  }

  limparArquivo(campo: 'imagemUrl' | 'anexoUrl'): void {
    this.form.patchValue(campo === 'anexoUrl' ? { anexoUrl: '', anexoLabel: '' } : { imagemUrl: '' });
    this.form.markAsDirty();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.swal.alerta('Preencha o título e o conteúdo da página.', 'Falta preencher');
      return;
    }

    const v = this.form.getRawValue();
    const payload = {
      titulo: v.titulo.trim(),
      resumoBusca: v.resumoBusca,
      conteudoHtml: v.conteudoHtml,
      imagemUrl: v.imagemUrl || null,
      anexoUrl: v.anexoUrl || null,
      anexoLabel: v.anexoUrl ? v.anexoLabel || null : null,
    };

    this.salvando = true;
    const requisicao = this.editandoId
      ? this.api.atualizar<PaginaAdmin>('paginas-institucionais', this.editandoId, payload)
      : this.api.criar<PaginaAdmin>('paginas-institucionais', payload);

    requisicao.subscribe({
      next: (salva) => {
        this.salvando = false;
        this.form.markAsPristine();
        this.carregar(salva.id);
      },
      error: (erro: HttpErrorResponse) => {
        this.salvando = false;
        this.swal.erro(typeof erro.error === 'string' ? erro.error : 'Não foi possível salvar a página.');
      },
    });
  }

  async excluir(): Promise<void> {
    const pagina = this.paginaAtual;
    if (!pagina) return;
    if (!(await this.swal.confirmarExclusao(`Excluir a página "${pagina.titulo}"? Quem acessar o endereço dela vai ver "página não encontrada".`))) return;

    this.api.excluir('paginas-institucionais', pagina.id).subscribe(() => {
      this.form.markAsPristine();
      this.editandoId = null;
      this.carregar();
    });
  }
}
