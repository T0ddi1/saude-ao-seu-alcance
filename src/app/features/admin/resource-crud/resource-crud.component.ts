import { Component, ElementRef, HostListener, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { UploadService } from '../../../core/services/upload.service';
import { SwalService } from '../../../core/services/swal.service';
import { ComponenteComAlteracoes } from '../../../core/guards/alteracoes-nao-salvas.guard';
import { CampoFormulario, RECURSOS_ADMIN, RecursoAdminConfig } from './admin-resources.config';
import { QuillEditorComponent } from '../../../shared/components/quill-editor/quill-editor.component';
import { ArtigoAdmin, CategoriaAdmin } from '../../../core/models/admin.model';
import { SecaoHomeConfigComponent } from '../secao-home-config/secao-home-config.component';
import { IconPickerComponent } from '../../../shared/components/icon-picker/icon-picker.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { IndicadorIbgeSelectComponent } from '../../../shared/components/indicador-ibge-select/indicador-ibge-select.component';
import { IndicadorIbgeOpcao } from '../../../core/models/admin.model';

const CHAVES_TITULO = ['titulo', 'label', 'nome', 'rotulo', 'chamada', 'tagline', 'newsletterTitulo'];
const CHAVES_RESUMO = ['resumo', 'descricao', 'newsletterDescricao', 'colunaTitulo', 'href', 'link'];
const CHAVES_LINK = ['href', 'link'];
const CHAVES_ICONE = ['icone'];

interface PaginaInstitucionalResumo {
  id: number;
  titulo: string;
  slug: string;
}

@Component({
  selector: 'app-resource-crud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, QuillEditorComponent, SecaoHomeConfigComponent, IconPickerComponent, IconComponent, IndicadorIbgeSelectComponent],
  templateUrl: './resource-crud.component.html',
  styleUrl: './resource-crud.component.scss',
})
export class ResourceCrudComponent implements OnInit, ComponenteComAlteracoes {
  private route = inject(ActivatedRoute);
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);
  private swal = inject(SwalService);
  private sanitizer = inject(DomSanitizer);

  @ViewChild('cardFormulario') cardFormulario?: ElementRef<HTMLElement>;

  config!: RecursoAdminConfig;
  itens: Record<string, unknown>[] = [];
  formulario!: FormGroup;
  editandoId: number | null = null;
  carregando = false;
  erro: string | null = null;
  enviandoImagem: Record<string, boolean> = {};
  artigos: ArtigoAdmin[] = [];
  paginas: PaginaInstitucionalResumo[] = [];
  categorias: CategoriaAdmin[] = [];
  indicadoresIbge: IndicadorIbgeOpcao[] = [];

  ngOnInit(): void {
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => (this.artigos = artigos));
    this.api.listar<PaginaInstitucionalResumo>('paginas-institucionais').subscribe((paginas) => (this.paginas = paginas));
    this.api.listar<CategoriaAdmin>('categorias').subscribe((categorias) => (this.categorias = categorias));
    this.api.listar<IndicadorIbgeOpcao>('indicadores-ibge').subscribe((indicadores) => (this.indicadoresIbge = indicadores));

    this.route.paramMap.subscribe((params) => {
      const chave = params.get('recurso') ?? '';
      this.config = RECURSOS_ADMIN[chave];
      this.montarFormulario();
      this.carregar();
    });
  }

  vincular(campo: string, valor: string): void {
    const [tipo, idTexto] = valor.split(':');
    const id = Number(idTexto);
    if (!tipo || !id) return;

    if (tipo === 'artigo') {
      const artigo = this.artigos.find((a) => a.id === id);
      if (artigo) this.formulario.patchValue({ [campo]: `/artigos/${artigo.categoriaSlug ?? 'geral'}/${artigo.slug}` });
    } else if (tipo === 'pagina') {
      const pagina = this.paginas.find((p) => p.id === id);
      if (pagina) this.formulario.patchValue({ [campo]: `/${pagina.slug}` });
    } else if (tipo === 'categoria') {
      const categoria = this.categorias.find((c) => c.id === id);
      if (categoria) this.formulario.patchValue({ [campo]: `/blog?categoria=${categoria.slug}` });
    }
  }

  get temPreviewVisual(): boolean {
    return true;
  }

  get previewTitulo(): string {
    return this.primeiroValor(CHAVES_TITULO) || 'Sem título ainda';
  }

  get previewResumo(): string | null {
    return this.primeiroValor(CHAVES_RESUMO, [this.previewTitulo]);
  }

  get previewLink(): string | null {
    return this.primeiroValor(CHAVES_LINK);
  }

  get previewIcone(): string | null {
    return this.primeiroValor(CHAVES_ICONE);
  }

  get previewImagem(): string | null {
    const campoImagem = this.config.campos.find((c) => c.tipo === 'image');
    return campoImagem ? (this.formulario.value[campoImagem.chave] as string) || null : null;
  }

  get previewRichtextCampo(): CampoFormulario | undefined {
    return this.config.campos.find((c) => c.tipo === 'richtext');
  }

  get previewRichtextHtml(): SafeHtml | null {
    const campo = this.previewRichtextCampo;
    if (!campo) return null;
    const html = (this.formulario.value[campo.chave] as string) || '<p><em>Nada escrito ainda.</em></p>';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private primeiroValor(chaves: string[], ignorar: (string | null)[] = []): string | null {
    for (const chave of chaves) {
      const valor = this.formulario?.value?.[chave];
      if (typeof valor === 'string' && valor.trim() && !ignorar.includes(valor)) return valor;
    }
    return null;
  }

  private montarFormulario(campos: Record<string, unknown> | null = null): void {
    const grupo: Record<string, unknown> = {};
    for (const campo of this.config.campos) {
      const valorInicial = campos ? campos[campo.chave] : campo.tipo === 'checkbox' ? false : campo.tipo === 'number' ? 0 : '';
      const validadores = campo.obrigatorio ? [Validators.required] : [];
      grupo[campo.chave] = [valorInicial, validadores];
    }
    this.formulario = this.fb.group(grupo);

    const controleIndicador = this.formulario.get('indicadorIbge');
    const controleValor = this.formulario.get('valor');
    if (controleIndicador && controleValor) {
      const campoValor = this.config.campos.find((c) => c.chave === 'valor');
      const aplicarValidadorValor = (chave: string | null) => {
        controleValor.setValidators(chave || !campoValor?.obrigatorio ? [] : [Validators.required]);
        controleValor.updateValueAndValidity();
      };

      controleIndicador.valueChanges.subscribe((chave: string | null) => {
        aplicarValidadorValor(chave);

        if (!chave) return;
        const opcao = this.indicadoresIbge.find((o) => o.chave === chave);
        if (opcao && !this.formulario.value.rotulo) {
          this.formulario.patchValue({ rotulo: opcao.rotulo });
        }
      });

      aplicarValidadorValor(controleIndicador.value);
    }
  }

  carregar(): void {
    this.carregando = true;
    this.erro = null;
    this.api.listar<Record<string, unknown>>(this.config.path).subscribe({
      next: (itens) => {
        this.itens = itens;
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os dados.';
        this.carregando = false;
      },
    });
  }

  editar(item: Record<string, unknown>): void {
    this.editandoId = item['id'] as number;
    this.montarFormulario(item);
    this.cardFormulario?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  cancelarEdicao(): void {
    this.editandoId = null;
    this.montarFormulario();
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formulario?.dirty ?? false;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  selecionarImagem(event: Event, chave: string): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviandoImagem[chave] = true;
    this.uploadService.enviar(arquivo).subscribe({
      next: (url) => {
        this.formulario.patchValue({ [chave]: url });
        this.enviandoImagem[chave] = false;
      },
      error: () => {
        this.erro = 'Não foi possível enviar a imagem.';
        this.enviandoImagem[chave] = false;
      },
    });
    input.value = '';
  }

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const payload = this.formulario.value;
    const requisicao = this.editandoId
      ? this.api.atualizar(this.config.path, this.editandoId, payload)
      : this.api.criar(this.config.path, payload);

    requisicao.subscribe({
      next: () => {
        this.cancelarEdicao();
        this.carregar();
      },
      error: (erro) => {
        this.erro = erro?.error ?? 'Não foi possível salvar.';
      },
    });
  }

  async excluir(item: Record<string, unknown>): Promise<void> {
    const ok = await this.swal.confirmarExclusao('Excluir este registro?');
    if (!ok) return;

    this.api.excluir(this.config.path, item['id'] as number).subscribe({
      next: () => this.carregar(),
      error: () => (this.erro = 'Não foi possível excluir.'),
    });
  }

  campoInvalido(campo: CampoFormulario): boolean {
    const controle = this.formulario.get(campo.chave);
    return !!controle && controle.invalid && controle.touched;
  }
}
