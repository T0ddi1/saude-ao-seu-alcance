import { Component, EventEmitter, Input, OnChanges, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { ConfiguracaoSecaoHomeAdmin, ArtigoAdmin } from '../../../core/models/admin.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { ROTULOS_TIPO_ESPACO } from '../resource-crud/admin-resources.config';
import { SwalService } from '../../../core/services/swal.service';

export const MODOS_POR_SECAO: Record<string, string[]> = {
  CarrosselDestaque: ['Manual', 'ArtigoFixo', 'DestaquesAuto', 'RecentesAuto', 'MaisSalvosAuto'],
  EmAlta: ['Manual', 'MaisVistosAuto', 'MaisSalvosAuto'],
  GradeConteudo: ['Manual', 'RecentesAuto', 'MaisSalvosAuto'],
  Patrocinio: ['Manual'],
  DadosSaude: ['Manual'],
  SelosConfianca: ['Manual'],
};

const DESCRICAO_MODO_AUTOMATICO: Record<string, (limite: number) => string> = {
  'CarrosselDestaque:DestaquesAuto': (l) => `Automático: mostra os ${l} artigos marcados como "Destaque" no cadastro de Artigos, do mais recente pro mais antigo.`,
  'CarrosselDestaque:RecentesAuto': (l) => `Automático: mostra os ${l} artigos publicados mais recentemente, do mais novo pro mais antigo.`,
  'CarrosselDestaque:MaisSalvosAuto': (l) => `Automático: mostra os ${l} artigos mais favoritados pelos leitores.`,
  'EmAlta:MaisVistosAuto': (l) => `Automático: mostra os ${l} artigos mais visualizados pelos leitores.`,
  'EmAlta:MaisSalvosAuto': (l) => `Automático: mostra os ${l} artigos mais favoritados pelos leitores.`,
  'GradeConteudo:RecentesAuto': (l) => `Automático: mostra os ${l} artigos publicados mais recentemente, do mais novo pro mais antigo.`,
  'GradeConteudo:MaisSalvosAuto': (l) => `Automático: mostra os ${l} artigos mais favoritados pelos leitores.`,
};

export const ROTULO_MODO: Record<string, string> = {
  Manual: 'Manual — eu escolho',
  ArtigoFixo: 'Artigo fixo — sem rotação',
  DestaquesAuto: 'Automático — artigos em destaque',
  RecentesAuto: 'Automático — mais recentes',
  MaisVistosAuto: 'Automático — mais vistos',
  MaisSalvosAuto: 'Automático — mais salvos',
};

export const SECOES_DE_ARTIGOS = ['CarrosselDestaque', 'EmAlta', 'GradeConteudo'];

export const SECOES_COM_TELA_PROPRIA = ['CarrosselDestaque', 'GradeConteudo', 'Patrocinio', 'DadosSaude', 'SelosConfianca'];

interface InfoRecursoSecao {

  path: string;
  tituloChave: string;
  iconeChave?: string;
  subtituloChave?: string;
}

const RECURSO_POR_SECAO: Record<string, InfoRecursoSecao> = {
  Patrocinio: { path: 'espacos-patrocinados', tituloChave: 'titulo', subtituloChave: 'tipo' },
  DadosSaude: { path: 'dados-saude', tituloChave: 'rotulo', subtituloChave: 'valor' },
  SelosConfianca: { path: 'selos-confianca', tituloChave: 'rotulo', iconeChave: 'icone' },
};

@Component({
  selector: 'app-secao-home-config',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, IconComponent],
  templateUrl: './secao-home-config.component.html',
  styleUrl: './secao-home-config.component.scss',
})
export class SecaoHomeConfigComponent implements OnInit, OnChanges {
  @Input({ required: true }) secao!: string;

  @Output() itensReordenados = new EventEmitter<void>();
  @Output() itemSelecionado = new EventEmitter<Record<string, unknown>>();

  private api = inject(AdminApiService);
  private swal = inject(SwalService);

  config: ConfiguracaoSecaoHomeAdmin | null = null;
  artigos: ArtigoAdmin[] = [];
  selecionados: ArtigoAdmin[] = [];
  itensReais: Record<string, unknown>[] = [];
  autoplaySegundos = 6;
  carregando = false;
  salvando = false;
  salvo = false;
  avisoLimite = false;

  ngOnInit(): void {
    this.carregar();
  }

  ngOnChanges(): void {
    if (this.secao) this.carregar();
  }

  ehSecaoDeArtigos(): boolean {
    return SECOES_DE_ARTIGOS.includes(this.secao);
  }

  ehCarrossel(): boolean {
    return this.secao === 'CarrosselDestaque';
  }

  infoRecurso(): InfoRecursoSecao | undefined {
    return RECURSO_POR_SECAO[this.secao];
  }

  rotuloModo(modo: string): string {
    return ROTULO_MODO[modo] ?? modo;
  }

  escolheArtigos(): boolean {
    return this.ehSecaoDeArtigos() && (this.config?.modo === 'Manual' || this.config?.modo === 'ArtigoFixo');
  }

  limiteEfetivo(): number {
    return this.config?.modo === 'ArtigoFixo' ? 1 : this.config?.limiteItens || 0;
  }

  modosDisponiveis(): string[] {
    return MODOS_POR_SECAO[this.secao] ?? ['Manual'];
  }

  descricaoModoAutomatico(): string | null {
    if (!this.config || this.config.modo === 'Manual' || this.config.modo === 'ArtigoFixo') return null;
    const chave = `${this.secao}:${this.config.modo}`;
    return DESCRICAO_MODO_AUTOMATICO[chave]?.(this.config.limiteItens) ?? null;
  }

  carregar(): void {
    this.carregando = true;
    this.api.listar<ArtigoAdmin>('artigos').subscribe((artigos) => {
      this.artigos = artigos;
      this.api.listar<ConfiguracaoSecaoHomeAdmin>('secoes-home').subscribe((secoes) => {
        this.config = secoes.find((s) => s.secao === this.secao) ?? null;
        this.selecionados = this.config ? this.extrairArtigosSelecionados(this.config) : [];
        this.autoplaySegundos = this.config ? this.extrairAutoplaySegundos(this.config) : 6;
        this.carregando = false;
      });
    });

    const info = this.infoRecurso();
    if (info) {
      this.api.listar<Record<string, unknown>>(info.path).subscribe((itens) => {
        this.itensReais = [...itens].sort((a, b) => Number(a['ordem'] ?? 0) - Number(b['ordem'] ?? 0));
      });
    }
  }

  itemTitulo(item: Record<string, unknown>): string {
    const chave = this.infoRecurso()?.tituloChave;
    return chave ? String(item[chave] ?? '') : '';
  }

  itemSubtitulo(item: Record<string, unknown>): string | null {
    const chave = this.infoRecurso()?.subtituloChave;
    if (!chave) return null;
    const valor = String(item[chave] ?? '');
    return chave === 'tipo' ? ROTULOS_TIPO_ESPACO[valor] ?? valor : valor;
  }

  itemIcone(item: Record<string, unknown>): string | null {
    const chave = this.infoRecurso()?.iconeChave;
    return chave ? String(item[chave] ?? '') : null;
  }

  selecionarItemReal(item: Record<string, unknown>): void {
    this.itemSelecionado.emit(item);
  }

  async removerItemReal(item: Record<string, unknown>, event: Event): Promise<void> {
    event.stopPropagation();
    const info = this.infoRecurso();
    if (!info) return;
    const ok = await this.swal.confirmarExclusao(`Excluir "${this.itemTitulo(item)}"?`);
    if (!ok) return;

    this.api.excluir(info.path, item['id'] as number).subscribe(() => {
      this.itensReais = this.itensReais.filter((i) => i['id'] !== item['id']);
      this.itensReordenados.emit();
    });
  }

  private extrairArtigosSelecionados(config: ConfiguracaoSecaoHomeAdmin): ArtigoAdmin[] {
    if (!config.configuracaoJson) return [];
    try {
      const dados = JSON.parse(config.configuracaoJson) as { artigoIds?: number[] };
      const ids = dados.artigoIds ?? [];
      return ids
        .map((id) => this.artigos.find((a) => a.id === id))
        .filter((a): a is ArtigoAdmin => !!a);
    } catch {
      return [];
    }
  }

  private extrairAutoplaySegundos(config: ConfiguracaoSecaoHomeAdmin): number {
    if (!config.configuracaoJson) return 6;
    try {
      const dados = JSON.parse(config.configuracaoJson) as { autoplaySegundos?: number };
      return dados.autoplaySegundos && dados.autoplaySegundos > 0 ? dados.autoplaySegundos : 6;
    } catch {
      return 6;
    }
  }

  atualizarAutoplaySegundos(valor: number): void {
    this.autoplaySegundos = valor > 0 ? valor : 1;
    this.mesclarConfiguracaoJson({ autoplaySegundos: this.autoplaySegundos });
  }

  private mesclarConfiguracaoJson(patch: Record<string, unknown>): void {
    if (!this.config) return;
    let atual: Record<string, unknown> = {};
    if (this.config.configuracaoJson) {
      try {
        atual = JSON.parse(this.config.configuracaoJson) as Record<string, unknown>;
      } catch {
        atual = {};
      }
    }
    this.config.configuracaoJson = JSON.stringify({ ...atual, ...patch });
  }

  quantidadeNoMockup(): number {
    if (this.escolheArtigos()) {
      return Math.max(this.selecionados.length, 1);
    }
    return Math.max(Math.min(this.config?.limiteItens || 1, 8), 1);
  }

  artigosDisponiveis(): ArtigoAdmin[] {
    return this.artigos.filter((a) => !this.selecionados.some((s) => s.id === a.id));
  }

  atingiuLimite(): boolean {
    return this.selecionados.length >= this.limiteEfetivo();
  }

  adicionarArtigo(artigoId: string): void {
    const id = Number(artigoId);
    if (!id) return;

    if (this.atingiuLimite()) {
      this.avisoLimite = true;
      setTimeout(() => (this.avisoLimite = false), 4000);
      return;
    }

    const artigo = this.artigos.find((a) => a.id === id);
    if (!artigo) return;

    this.selecionados = [...this.selecionados, artigo];
    this.sincronizarConfiguracaoJson();
  }

  removerArtigo(artigo: ArtigoAdmin): void {
    this.selecionados = this.selecionados.filter((a) => a.id !== artigo.id);
    this.sincronizarConfiguracaoJson();
  }

  soltar(event: CdkDragDrop<ArtigoAdmin[]>): void {
    const lista = [...this.selecionados];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.selecionados = lista;
    this.sincronizarConfiguracaoJson();
  }

  soltarItemReal(event: CdkDragDrop<Record<string, unknown>[]>): void {
    const info = this.infoRecurso();
    if (!info) return;

    const lista = [...this.itensReais];
    moveItemInArray(lista, event.previousIndex, event.currentIndex);
    this.itensReais = lista;

    lista.forEach((item, indice) => {
      const novaOrdem = indice + 1;
      if (Number(item['ordem']) === novaOrdem) return;
      item['ordem'] = novaOrdem;
      this.api.atualizar(info.path, item['id'] as number, item).subscribe();
    });

    this.itensReordenados.emit();
  }

  private sincronizarConfiguracaoJson(): void {
    this.mesclarConfiguracaoJson({ artigoIds: this.selecionados.map((a) => a.id) });
  }

  salvar(): void {
    if (!this.config) return;
    if (this.config.modo === 'ArtigoFixo' && this.selecionados.length > 1) {
      this.selecionados = this.selecionados.slice(0, 1);
      this.sincronizarConfiguracaoJson();
    }
    this.salvando = true;
    this.salvo = false;
    this.api
      .atualizarPorChave<ConfiguracaoSecaoHomeAdmin>('secoes-home', this.secao, {
        modo: this.config.modo,
        limiteItens: this.config.limiteItens,
        configuracaoJson: this.config.configuracaoJson,
      })
      .subscribe({
        next: () => {
          this.salvando = false;
          this.salvo = true;
        },
        error: () => (this.salvando = false),
      });
  }
}
