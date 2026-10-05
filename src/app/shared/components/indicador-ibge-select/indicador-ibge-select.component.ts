import { Component, OnDestroy, OnInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { IndicadorIbgeOpcao } from '../../../core/models/admin.model';

interface IbgeTabela {
  id: number;
  nome: string;
  pesquisa: string;
}
interface IbgeVariavel {
  id: number;
  nome: string;
  unidade: string;
}
interface IbgeCategoria {
  id: number;
  nome: string;
}
interface IbgeClassificacao {
  id: number;
  nome: string;
  categorias: IbgeCategoria[];
}
interface IbgeMetadados {
  id: number;
  nome: string;
  variaveis: IbgeVariavel[];
  classificacoes: IbgeClassificacao[];
}
interface DefinicaoIbge {
  tabela: number;
  variavel: number;
  classificacoes: Record<number, number>;
  classificacaoAno: number | null;
  casasDecimais: number;
  complementoModelo: string;
}

@Component({
  selector: 'app-indicador-ibge-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './indicador-ibge-select.component.html',
  styleUrl: './indicador-ibge-select.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IndicadorIbgeSelectComponent),
      multi: true,
    },
  ],
})
export class IndicadorIbgeSelectComponent implements ControlValueAccessor, OnInit, OnDestroy {
  private api = inject(AdminApiService);
  private destruido = new Subject<void>();

  valor: string | null = null;
  disabled = false;
  aberto = false;
  rotuloSelecionado: string | null = null;

  // catálogo fixo antigo (9 indicadores), mantido só pra exibir o rótulo de valores já salvos assim
  private opcoesAntigas: IndicadorIbgeOpcao[] = [];

  // ---- busca real no catálogo completo do IBGE ----
  busca = '';
  private busca$ = new Subject<string>();
  buscando = false;
  tabelas: IbgeTabela[] = [];
  tabelaSelecionada: IbgeTabela | null = null;
  metadados: IbgeMetadados | null = null;
  variavelId: number | null = null;
  classificacaoAnoId: number | null = null;
  categoriaPorClassificacao: Record<number, number | null> = {};
  casasDecimais = 1;
  complementoModelo = 'Fonte: IBGE, {ano}';
  buscandoValor = false;
  preview: { valor: string; complemento: string } | null = null;
  erroValor: string | null = null;

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.api.listar<IndicadorIbgeOpcao>('indicadores-ibge').subscribe((opcoes) => {
      this.opcoesAntigas = opcoes;
      this.atualizarRotulo();
    });
    this.busca$.pipe(debounceTime(400), takeUntil(this.destruido)).subscribe((termo) => this.executarBusca(termo));
  }

  ngOnDestroy(): void {
    this.destruido.next();
    this.destruido.complete();
  }

  abrir(): void {
    if (this.disabled) return;
    this.resetarEstadoBusca();

    const definicao = this.parsearJson(this.valor);
    if (definicao) {
      this.casasDecimais = definicao.casasDecimais ?? 1;
      this.complementoModelo = definicao.complementoModelo ?? 'Fonte: IBGE, {ano}';
      this.variavelId = definicao.variavel;
      this.classificacaoAnoId = definicao.classificacaoAno ?? null;
      this.categoriaPorClassificacao = { ...definicao.classificacoes };
      this.api.obterSingleton<IbgeMetadados>(`ibge/tabelas/${definicao.tabela}/metadados`).subscribe((metadados) => {
        this.metadados = metadados;
        this.tabelaSelecionada = { id: metadados.id, nome: metadados.nome, pesquisa: '' };
      });
    }

    this.aberto = true;
  }

  fechar(): void {
    this.aberto = false;
    this.onTouched();
  }

  escolherNenhum(): void {
    this.valor = null;
    this.rotuloSelecionado = null;
    this.onChange(null);
    this.fechar();
  }

  private resetarEstadoBusca(): void {
    this.busca = '';
    this.tabelas = [];
    this.tabelaSelecionada = null;
    this.metadados = null;
    this.variavelId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.casasDecimais = 1;
    this.complementoModelo = 'Fonte: IBGE, {ano}';
    this.preview = null;
    this.erroValor = null;
  }

  digitarBusca(texto: string): void {
    this.busca = texto;
    this.busca$.next(texto);
  }

  private executarBusca(busca: string): void {
    this.buscando = true;
    this.api.listarComQuery<IbgeTabela>('ibge/tabelas', `busca=${encodeURIComponent(busca)}`).subscribe({
      next: (tabelas) => {
        this.tabelas = tabelas;
        this.buscando = false;
      },
      error: () => (this.buscando = false),
    });
  }

  selecionarTabela(tabela: IbgeTabela): void {
    this.tabelaSelecionada = tabela;
    this.tabelas = [];
    this.metadados = null;
    this.variavelId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.preview = null;
    this.erroValor = null;

    this.api.obterSingleton<IbgeMetadados>(`ibge/tabelas/${tabela.id}/metadados`).subscribe((metadados) => {
      this.metadados = metadados;
    });
  }

  trocarTabela(): void {
    this.tabelaSelecionada = null;
    this.metadados = null;
    this.variavelId = null;
    this.classificacaoAnoId = null;
    this.categoriaPorClassificacao = {};
    this.preview = null;
    this.erroValor = null;
  }

  truncarOpcao(texto: string, tamanhoMaximo = 90): string {
    return texto.length > tamanhoMaximo ? texto.slice(0, tamanhoMaximo).trimEnd() + '…' : texto;
  }

  selecionarVariavel(id: number | null): void {
    this.variavelId = id;
    this.preview = null;
    this.erroValor = null;
  }

  alternarClassificacaoAno(classificacaoId: number): void {
    this.classificacaoAnoId = this.classificacaoAnoId === classificacaoId ? null : classificacaoId;
    delete this.categoriaPorClassificacao[classificacaoId];
    this.preview = null;
    this.erroValor = null;
  }

  selecionarCategoriaClassificacao(classificacaoId: number, categoriaId: string): void {
    this.categoriaPorClassificacao = { ...this.categoriaPorClassificacao, [classificacaoId]: categoriaId ? Number(categoriaId) : null };
    this.preview = null;
    this.erroValor = null;
  }

  private montarClassificacoes(): Record<number, number> {
    const classificacoes: Record<number, number> = {};
    for (const [id, categoriaId] of Object.entries(this.categoriaPorClassificacao)) {
      if (Number(id) === this.classificacaoAnoId) continue;
      if (categoriaId) classificacoes[Number(id)] = categoriaId;
    }
    return classificacoes;
  }

  buscarValorPreview(): void {
    if (!this.variavelId || !this.tabelaSelecionada) return;

    this.buscandoValor = true;
    this.preview = null;
    this.erroValor = null;
    this.api
      .criar<{ valor: string; complemento: string }>('ibge/valor', {
        tabela: this.tabelaSelecionada.id,
        variavel: this.variavelId,
        classificacoes: this.montarClassificacoes(),
        classificacaoAno: this.classificacaoAnoId,
        casasDecimais: this.casasDecimais,
        complementoModelo: this.complementoModelo,
      })
      .subscribe({
        next: (resultado) => {
          this.preview = resultado;
          this.buscandoValor = false;
        },
        error: (erro: HttpErrorResponse) => {
          this.erroValor = typeof erro.error === 'string' ? erro.error : 'Não foi possível encontrar um valor pra essa combinação. Tente outra variável ou classificação.';
          this.buscandoValor = false;
        },
      });
  }

  confirmar(): void {
    if (!this.tabelaSelecionada || !this.variavelId) return;

    const json = JSON.stringify({
      tabela: this.tabelaSelecionada.id,
      variavel: this.variavelId,
      classificacoes: this.montarClassificacoes(),
      classificacaoAno: this.classificacaoAnoId,
      casasDecimais: this.casasDecimais,
      complementoModelo: this.complementoModelo,
    });

    this.valor = json;
    const variavel = this.metadados?.variaveis.find((v) => v.id === this.variavelId);
    this.rotuloSelecionado = `${this.tabelaSelecionada.nome}${variavel ? ' — ' + variavel.nome : ''}`;
    this.onChange(json);
    this.fechar();
  }

  private parsearJson(valor: string | null): DefinicaoIbge | null {
    if (!valor || !valor.trim().startsWith('{')) return null;
    try {
      return JSON.parse(valor);
    } catch {
      return null;
    }
  }

  private atualizarRotulo(): void {
    if (!this.valor) {
      this.rotuloSelecionado = null;
      return;
    }

    if (this.parsearJson(this.valor)) {
      // rótulo já foi montado em confirmar(); se veio de fora (ex: recarregar a lista), mostra algo genérico até abrir.
      if (!this.rotuloSelecionado) this.rotuloSelecionado = 'Indicador do IBGE (buscado dinamicamente)';
      return;
    }

    this.rotuloSelecionado = this.opcoesAntigas.find((o) => o.chave === this.valor)?.rotulo ?? null;
  }

  writeValue(value: string | null): void {
    this.valor = value ?? null;
    this.atualizarRotulo();
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
