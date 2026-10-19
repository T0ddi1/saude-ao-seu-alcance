import { DicaImagemComponent } from '../../shared/components/dica-imagem/dica-imagem.component';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UploadService } from '../../core/services/upload.service';
import { SwalService } from '../../core/services/swal.service';
import { ArtigoAdmin, ArtigoSalvar, CategoriaAdmin } from '../../core/models/admin.model';
import { QuillEditorComponent } from '../../shared/components/quill-editor/quill-editor.component';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

type Filtro = 'todos' | 'publicados' | 'agendados' | 'rascunhos';
type Situacao = 'rascunho' | 'publicar' | 'agendar';

const LIMITE_RESUMO = 500;
const LIMITE_TITULO = 200;

@Component({
  selector: 'app-artigos-admin',
  standalone: true,
  imports: [DicaImagemComponent, CommonModule, FormsModule, ReactiveFormsModule, QuillEditorComponent],
  providers: [DatePipe],
  templateUrl: './artigos-admin.component.html',
  styleUrl: './artigos-admin.component.scss',
})
export class ArtigosAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private swal = inject(SwalService);
  private sanitizer = inject(DomSanitizer);

  readonly limiteResumo = LIMITE_RESUMO;
  readonly limiteTitulo = LIMITE_TITULO;

  artigos: ArtigoAdmin[] = [];
  categorias: CategoriaAdmin[] = [];
  carregando = false;
  erro: string | null = null;
  salvando = false;
  enviandoCapa = false;

  // lista
  busca = '';
  filtro: Filtro = 'todos';
  categoriaFiltroId: number | null = null;

  // editor
  noEditor = false;
  editandoId: number | null = null;
  abaAtiva: 'editar' | 'preview' = 'editar';
  situacao: Situacao = 'rascunho';
  dataAgendada = '';

  formulario = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(LIMITE_TITULO)]],
    resumo: ['', [Validators.required, Validators.maxLength(LIMITE_RESUMO)]],
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

  temAlteracoesNaoSalvas(): boolean {
    return this.noEditor && this.formulario.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  // ---- Lista ----

  get totais(): { todos: number; publicados: number; agendados: number; rascunhos: number } {
    const publicados = this.artigos.filter((a) => a.publicado).length;
    const agendados = this.artigos.filter((a) => !a.publicado && !!a.publicacaoAgendadaEm).length;
    return { todos: this.artigos.length, publicados, agendados, rascunhos: this.artigos.length - publicados - agendados };
  }

  private estaAgendado(artigo: ArtigoAdmin): boolean {
    return !artigo.publicado && !!artigo.publicacaoAgendadaEm;
  }

  get artigosFiltrados(): ArtigoAdmin[] {
    const termo = this.busca.trim().toLowerCase();
    return this.artigos
      .filter((a) => {
        if (this.filtro === 'todos') return true;
        if (this.filtro === 'publicados') return a.publicado;
        if (this.filtro === 'agendados') return this.estaAgendado(a);
        return !a.publicado && !a.publicacaoAgendadaEm;
      })
      .filter((a) => this.categoriaFiltroId === null || a.categoriaId === this.categoriaFiltroId)
      .filter((a) => !termo || a.titulo.toLowerCase().includes(termo) || (a.autorExibicao ?? '').toLowerCase().includes(termo))
      .sort((a, b) => (b.publicadoEm ?? b.publicacaoAgendadaEm ?? b.criadoEm).localeCompare(a.publicadoEm ?? a.publicacaoAgendadaEm ?? a.criadoEm));
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

  linkNoSite(artigo: ArtigoAdmin): string {
    return `#/artigos/${artigo.categoriaSlug ?? 'geral'}/${artigo.slug}`;
  }

  // ---- Editor ----

  get artigoAtual(): ArtigoAdmin | null {
    return this.artigos.find((a) => a.id === this.editandoId) ?? null;
  }

  novo(): void {
    this.noEditor = true;
    this.editandoId = null;
    this.abaAtiva = 'editar';
    this.situacao = 'rascunho';
    this.dataAgendada = '';
    this.erro = null;
    this.formulario.reset({ destaque: false, categoriaId: null });
  }

  editar(artigo: ArtigoAdmin): void {
    this.noEditor = true;
    this.editandoId = artigo.id;
    this.abaAtiva = 'editar';
    this.situacao = this.estaAgendado(artigo) ? 'agendar' : 'rascunho';
    this.dataAgendada = artigo.publicacaoAgendadaEm ? this.paraCampoLocal(artigo.publicacaoAgendadaEm) : '';
    this.erro = null;
    this.formulario.reset({
      titulo: artigo.titulo,
      resumo: artigo.resumo,
      conteudoHtml: artigo.conteudoHtml,
      imagemCapaUrl: artigo.imagemCapaUrl ?? '',
      categoriaId: artigo.categoriaId ?? null,
      autorExibicao: artigo.autorExibicao ?? '',
      autorCargo: artigo.autorCargo ?? '',
      destaque: artigo.destaque,
    });
  }

  async voltarParaLista(): Promise<void> {
    if (this.formulario.dirty && !(await this.swal.confirmarSaidaComAlteracoes())) return;
    this.noEditor = false;
    this.editandoId = null;
    this.formulario.reset({ destaque: false, categoriaId: null });
  }

  selecionarCapa(event: Event): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviandoCapa = true;
    this.uploadService.enviar(arquivo).subscribe({
      next: (url) => {
        this.formulario.patchValue({ imagemCapaUrl: url });
        this.formulario.markAsDirty();
        this.enviandoCapa = false;
      },
      error: () => {
        this.enviandoCapa = false;
        this.swal.erro('Não foi possível enviar a imagem de capa.');
      },
    });
    input.value = '';
  }

  removerCapa(): void {
    this.formulario.patchValue({ imagemCapaUrl: '' });
    this.formulario.markAsDirty();
  }

  /** Converte a data da API (UTC) pro formato do campo de data e hora local. */
  private paraCampoLocal(iso: string): string {
    const d = new Date(iso);
    const dois = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }

  get minimoAgendamento(): string {
    return this.paraCampoLocal(new Date(Date.now() + 60_000).toISOString());
  }

  get rotuloSalvar(): string {
    if (this.editandoId && this.artigoAtual?.publicado) return 'Salvar alterações';
    if (this.situacao === 'publicar') return 'Salvar e publicar';
    if (this.situacao === 'agendar') return 'Salvar e agendar';
    return this.editandoId ? 'Salvar rascunho' : 'Salvar rascunho';
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      this.swal.alerta('Preencha título, resumo (até 500 caracteres), conteúdo e o tópico antes de salvar.', 'Falta preencher');
      return;
    }

    const jaPublicado = !!this.artigoAtual?.publicado;
    if (!jaPublicado && this.situacao === 'agendar') {
      if (!this.dataAgendada || new Date(this.dataAgendada).getTime() <= Date.now()) {
        this.swal.alerta('Escolha uma data e hora no futuro pra publicar o artigo.', 'Data do agendamento');
        return;
      }
    }

    const payload = this.formulario.getRawValue() as ArtigoSalvar;
    this.salvando = true;

    const requisicao = this.editandoId
      ? this.api.atualizar<ArtigoAdmin>('artigos', this.editandoId, payload)
      : this.api.criar<ArtigoAdmin>('artigos', payload);

    requisicao.subscribe({
      next: (salvo) => {
        this.formulario.markAsPristine();
        this.aplicarSituacao(salvo, jaPublicado);
      },
      error: (erro: HttpErrorResponse) => {
        this.salvando = false;
        this.swal.erro(typeof erro.error === 'string' ? erro.error : 'Não foi possível salvar o artigo.');
      },
    });
  }

  /** Depois de salvar o conteúdo, aplica o que foi escolhido em "Publicação": publicar agora, agendar ou manter rascunho. */
  private aplicarSituacao(salvo: ArtigoAdmin, jaPublicado: boolean): void {
    const concluir = () => this.depoisDeSalvar(salvo.id);
    const falhar = (erro: HttpErrorResponse) => {
      this.salvando = false;
      this.swal.erro(typeof erro.error === 'string' ? erro.error : 'O artigo foi salvo, mas não foi possível mudar a publicação.');
      this.depoisDeSalvar(salvo.id);
    };

    if (jaPublicado) return concluir();

    if (this.situacao === 'publicar') {
      this.api.acao<ArtigoAdmin>('artigos', salvo.id, 'publicar').subscribe({ next: concluir, error: falhar });
    } else if (this.situacao === 'agendar') {
      this.api
        .acaoComBody<ArtigoAdmin>('artigos', salvo.id, 'agendar', { publicarEm: new Date(this.dataAgendada).toISOString() })
        .subscribe({ next: concluir, error: falhar });
    } else if (salvo.publicacaoAgendadaEm) {
      this.api.acao<ArtigoAdmin>('artigos', salvo.id, 'cancelar-agendamento').subscribe({ next: concluir, error: falhar });
    } else {
      concluir();
    }
  }

  private depoisDeSalvar(id: number): void {
    this.salvando = false;
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => {
      this.artigos = artigos;
      const salvo = artigos.find((a) => a.id === id);
      if (salvo) this.editar(salvo);
    });
  }

  alternarPublicacao(artigo: ArtigoAdmin, evento?: Event): void {
    evento?.stopPropagation();
    const acao = artigo.publicado ? 'despublicar' : 'publicar';
    this.api.acao<ArtigoAdmin>('artigos', artigo.id, acao).subscribe(() => this.carregar());
  }

  async excluir(artigo: ArtigoAdmin, evento?: Event): Promise<void> {
    evento?.stopPropagation();
    const ok = await this.swal.confirmarExclusao(`Excluir o artigo "${artigo.titulo}"? Essa ação não pode ser desfeita.`);
    if (!ok) return;

    this.api.excluir('artigos', artigo.id).subscribe(() => {
      if (this.editandoId === artigo.id) {
        this.formulario.markAsPristine();
        this.noEditor = false;
        this.editandoId = null;
      }
      this.carregar();
    });
  }

  get categoriaNomeSelecionada(): string {
    const id = this.formulario.value.categoriaId;
    return this.categorias.find((c) => c.id === id)?.nome ?? '';
  }

  get resumoRestante(): number {
    return LIMITE_RESUMO - (this.formulario.value.resumo?.length ?? 0);
  }

  get conteudoPreview(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(this.formulario.value.conteudoHtml || '<p><em>Nada escrito ainda.</em></p>');
  }
}
