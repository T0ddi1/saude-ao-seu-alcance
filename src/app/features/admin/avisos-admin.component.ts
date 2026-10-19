import { DicaImagemComponent } from '../../shared/components/dica-imagem/dica-imagem.component';
import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminApiService } from '../../core/services/admin-api.service';
import { SwalService } from '../../core/services/swal.service';
import { UploadService } from '../../core/services/upload.service';
import { ArtigoAdmin, CategoriaAdmin } from '../../core/models/admin.model';
import { LinkVinculoComponent } from '../../shared/components/link-vinculo/link-vinculo.component';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

interface AvisoAdmin {
  id: number;
  titulo: string;
  mensagem?: string | null;
  imagemUrl?: string | null;
  somenteImagem: boolean;
  textoBotao?: string | null;
  link?: string | null;
  externo: boolean;
  permiteNaoVerMais: boolean;
  inicioEm?: string | null;
  fimEm?: string | null;
  ordem: number;
  ativo: boolean;
}

interface PaginaResumo {
  id: number;
  titulo: string;
  slug: string;
}

type Situacao = 'no-ar' | 'agendado' | 'encerrado' | 'escondido';

const dois = (n: number) => String(n).padStart(2, '0');

/** ISO (UTC) da API -> valor do <input type="datetime-local"> no horário do navegador. */
function paraCampoLocal(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${dois(d.getHours())}:${dois(d.getMinutes())}`;
}

function deCampoLocal(valor: string | null | undefined): string | null {
  return valor ? new Date(valor).toISOString() : null;
}

@Component({
  selector: 'app-avisos-admin',
  standalone: true,
  imports: [DicaImagemComponent, CommonModule, ReactiveFormsModule, DragDropModule, LinkVinculoComponent],
  templateUrl: './avisos-admin.component.html',
  styleUrl: './avisos-admin.component.scss',
})
export class AvisosAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private swal = inject(SwalService);
  private upload = inject(UploadService);

  itens: AvisoAdmin[] = [];
  artigos: ArtigoAdmin[] = [];
  paginas: PaginaResumo[] = [];
  categorias: CategoriaAdmin[] = [];

  carregando = true;
  erro: string | null = null;
  modalAberto = false;
  editando: AvisoAdmin | null = null;
  salvando = false;
  enviandoImagem = false;

  form = this.fb.nonNullable.group({
    formato: ['texto' as 'texto' | 'banner'],
    titulo: ['', Validators.required],
    mensagem: [''],
    imagemUrl: [''],
    textoBotao: ['Saiba mais'],
    link: [''],
    externo: [false],
    permiteNaoVerMais: [true],
    publicacao: ['sempre' as 'sempre' | 'agendar'],
    inicio: [''],
    fim: [''],
    ativo: [true],
  });

  ngOnInit(): void {
    this.carregar();
    this.api.listar<ArtigoAdmin>('artigos').subscribe((a) => (this.artigos = a));
    this.api.listar<PaginaResumo>('paginas-institucionais').subscribe((p) => (this.paginas = p));
    this.api.listar<CategoriaAdmin>('categorias').subscribe((c) => (this.categorias = c));
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.modalAberto && this.form.dirty;
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
    this.api.listar<AvisoAdmin>('avisos-site').subscribe({
      next: (itens) => {
        this.itens = itens.sort((a, b) => a.ordem - b.ordem);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar os avisos.';
        this.carregando = false;
      },
    });
  }

  situacao(aviso: AvisoAdmin): Situacao {
    if (!aviso.ativo) return 'escondido';
    const agora = Date.now();
    if (aviso.inicioEm && new Date(aviso.inicioEm).getTime() > agora) return 'agendado';
    if (aviso.fimEm && new Date(aviso.fimEm).getTime() <= agora) return 'encerrado';
    return 'no-ar';
  }

  formatar(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    return `${dois(d.getDate())}/${dois(d.getMonth() + 1)}/${d.getFullYear()} às ${dois(d.getHours())}:${dois(d.getMinutes())}`;
  }

  rotuloSituacao(aviso: AvisoAdmin): string {
    switch (this.situacao(aviso)) {
      case 'escondido':
        return 'Escondido do site';
      case 'agendado':
        return `Aparece a partir de ${this.formatar(aviso.inicioEm)}`;
      case 'encerrado':
        return `Encerrado em ${this.formatar(aviso.fimEm)}`;
      default:
        return aviso.fimEm ? `No ar até ${this.formatar(aviso.fimEm)}` : 'No ar';
    }
  }

  // ---- Conflito de datas ----

  private intervalo(inicio?: string | null, fim?: string | null): [number, number] {
    return [inicio ? new Date(inicio).getTime() : -Infinity, fim ? new Date(fim).getTime() : Infinity];
  }

  /** Outros avisos ligados cujas datas se cruzam com essas — eles aparecem em sequência, um de cada vez. */
  sobrepostos(id: number | null, inicio?: string | null, fim?: string | null): AvisoAdmin[] {
    const [a1, a2] = this.intervalo(inicio, fim);
    return this.itens.filter((o) => {
      if (o.id === id || !o.ativo) return false;
      const [b1, b2] = this.intervalo(o.inicioEm, o.fimEm);
      if (b2 <= Date.now()) return false;
      return a1 < b2 && b1 < a2;
    });
  }

  temConflito(aviso: AvisoAdmin): boolean {
    if (this.situacao(aviso) === 'escondido' || this.situacao(aviso) === 'encerrado') return false;
    return this.sobrepostos(aviso.id, aviso.inicioEm, aviso.fimEm).length > 0;
  }

  get conflitoAtual(): AvisoAdmin[] {
    const v = this.form.getRawValue();
    if (!v.ativo) return [];
    const agendar = v.publicacao === 'agendar';
    return this.sobrepostos(this.editando?.id ?? null, agendar ? deCampoLocal(v.inicio) : null, agendar ? deCampoLocal(v.fim) : null);
  }

  // ---- Popup do admin ----

  abrirNovo(): void {
    this.editando = null;
    this.form.reset({
      formato: 'texto',
      titulo: '',
      mensagem: '',
      imagemUrl: '',
      textoBotao: 'Saiba mais',
      link: '',
      externo: false,
      permiteNaoVerMais: true,
      publicacao: 'sempre',
      inicio: '',
      fim: '',
      ativo: true,
    });
    this.modalAberto = true;
  }

  abrirEdicao(aviso: AvisoAdmin): void {
    this.editando = aviso;
    const agendado = !!(aviso.inicioEm || aviso.fimEm);
    this.form.reset({
      formato: aviso.somenteImagem ? 'banner' : 'texto',
      titulo: aviso.titulo,
      mensagem: aviso.mensagem ?? '',
      imagemUrl: aviso.imagemUrl ?? '',
      textoBotao: aviso.textoBotao ?? '',
      link: aviso.link ?? '',
      externo: aviso.externo,
      permiteNaoVerMais: aviso.permiteNaoVerMais,
      publicacao: agendado ? 'agendar' : 'sempre',
      inicio: paraCampoLocal(aviso.inicioEm),
      fim: paraCampoLocal(aviso.fimEm),
      ativo: aviso.ativo,
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

  enviarImagem(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;
    this.enviandoImagem = true;
    this.upload.enviar(arquivo).subscribe({
      next: (url) => {
        this.form.patchValue({ imagemUrl: url });
        this.form.markAsDirty();
        this.enviandoImagem = false;
      },
      error: () => {
        this.enviandoImagem = false;
        this.swal.erro('Não foi possível enviar a imagem.');
      },
    });
    input.value = '';
  }

  removerImagem(): void {
    this.form.patchValue({ imagemUrl: '' });
    this.form.markAsDirty();
  }

  /** Texto que explica ao admin qual tamanho/proporção de imagem não fica cortada. */
  get dicaImagem(): string {
    if (this.form.value.formato === 'banner') {
      return 'Aparece inteira, sem cortar, com até 720 px de largura na tela do visitante. Ideal: 1440 × 810 px (formato 16:9, horizontal) ou 1200 × 900 px (4:3). Evite imagens muito altas (verticais): elas encolhem pra caber na tela.';
    }
    return 'Aparece no topo do aviso, com 520 px de largura e 240 px de altura, e é cortada ao centro pra preencher. Ideal: 1040 × 480 px (proporção ~2:1, bem horizontal). Deixe o assunto principal no meio da imagem.';
  }

  get minimoAgora(): string {
    return paraCampoLocal(new Date().toISOString());
  }

  async salvar(): Promise<void> {
    const v = this.form.getRawValue();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      await this.swal.alerta('Dê um título ao aviso (ele também identifica o aviso nesta lista).', 'Faltam dados');
      return;
    }
    if (v.formato === 'banner' && !v.imagemUrl) {
      await this.swal.alerta('Um aviso só com imagem precisa da arte. Envie a imagem.', 'Faltou a imagem');
      return;
    }
    if (v.formato === 'texto' && !v.mensagem.trim() && !v.imagemUrl) {
      await this.swal.alerta('Escreva a mensagem do aviso (ou envie uma imagem).', 'Aviso vazio');
      return;
    }

    let inicio: string | null = null;
    let fim: string | null = null;
    if (v.publicacao === 'agendar') {
      inicio = deCampoLocal(v.inicio);
      fim = deCampoLocal(v.fim);
      if (!inicio && !fim) {
        await this.swal.alerta('Escolha quando o aviso começa e/ou quando termina — ou marque "Sempre no ar".', 'Agendamento');
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

    const conflitos = this.conflitoAtual;
    if (conflitos.length) {
      const nomes = conflitos.map((o) => `"${o.titulo}"`).join(', ');
      const seguir = await this.swal.confirmarAcao(
        `Nesse período também aparecem: ${nomes}. Os avisos são mostrados um de cada vez, na ordem da lista — o visitante vê um e depois o próximo. Salvar mesmo assim?`,
        'Conflito de datas',
        'Salvar mesmo assim',
      );
      if (!seguir) return;
    }

    const banner = v.formato === 'banner';
    const payload = {
      titulo: v.titulo.trim(),
      mensagem: banner ? null : v.mensagem.trim() || null,
      imagemUrl: v.imagemUrl || null,
      somenteImagem: banner,
      textoBotao: banner ? null : v.textoBotao.trim() || null,
      link: v.link.trim() || null,
      externo: v.externo,
      permiteNaoVerMais: v.permiteNaoVerMais,
      inicioEm: inicio,
      fimEm: fim,
      ordem: this.editando ? this.editando.ordem : Math.max(0, ...this.itens.map((i) => i.ordem)) + 1,
      ativo: v.ativo,
    };

    this.salvando = true;
    const req = this.editando ? this.api.atualizar<AvisoAdmin>('avisos-site', this.editando.id, payload) : this.api.criar<AvisoAdmin>('avisos-site', payload);
    req.subscribe({
      next: () => {
        this.salvando = false;
        this.form.markAsPristine();
        this.modalAberto = false;
        this.carregar();
      },
      error: (e) => {
        this.salvando = false;
        this.swal.erro(typeof e?.error === 'string' && e.error.length < 200 ? e.error : 'Não foi possível salvar o aviso.');
      },
    });
  }

  // ---- Ações da lista ----

  private payloadDe(a: AvisoAdmin, mudancas: Partial<AvisoAdmin> = {}): Record<string, unknown> {
    const i = { ...a, ...mudancas };
    return {
      titulo: i.titulo,
      mensagem: i.mensagem ?? null,
      imagemUrl: i.imagemUrl ?? null,
      somenteImagem: i.somenteImagem,
      textoBotao: i.textoBotao ?? null,
      link: i.link ?? null,
      externo: i.externo,
      permiteNaoVerMais: i.permiteNaoVerMais,
      inicioEm: i.inicioEm ?? null,
      fimEm: i.fimEm ?? null,
      ordem: i.ordem,
      ativo: i.ativo,
    };
  }

  alternarVisivel(aviso: AvisoAdmin, evento: Event): void {
    evento.stopPropagation();
    const ativo = !aviso.ativo;
    this.api.atualizar('avisos-site', aviso.id, this.payloadDe(aviso, { ativo })).subscribe({
      next: () => (aviso.ativo = ativo),
      error: () => this.swal.erro('Não foi possível alterar a visibilidade.'),
    });
  }

  async excluir(aviso: AvisoAdmin, evento: Event): Promise<void> {
    evento.stopPropagation();
    const ok = await this.swal.confirmarExclusao(`Excluir o aviso "${aviso.titulo}"? Se só quiser tirar do ar por um tempo, use o olhinho.`);
    if (!ok) return;
    this.api.excluir('avisos-site', aviso.id).subscribe({
      next: () => this.carregar(),
      error: () => this.swal.erro('Não foi possível excluir.'),
    });
  }

  soltar(evento: CdkDragDrop<AvisoAdmin[]>): void {
    const lista = [...this.itens];
    moveItemInArray(lista, evento.previousIndex, evento.currentIndex);
    this.itens = lista;
    lista.forEach((aviso, indice) => {
      const ordem = indice + 1;
      if (aviso.ordem === ordem) return;
      aviso.ordem = ordem;
      this.api.atualizar('avisos-site', aviso.id, this.payloadDe(aviso)).subscribe();
    });
  }
}
