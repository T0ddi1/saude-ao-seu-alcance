import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { UploadService } from '../../core/services/upload.service';
import { GRUPOS_PALETA, TODOS_TOKENS_PALETA, TokenCor } from '../../core/data/paleta-cores';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

interface ConfiguracaoSiteAdmin {
  id: number;
  logoUrl: string | null;
  faviconUrl: string | null;
  coresJson: string | null;
}

const HEX_VALIDO = /^#[0-9a-f]{6}$/i;

@Component({
  selector: 'app-site-config-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './site-config-admin.component.html',
  styleUrl: './site-config-admin.component.scss',
})
export class SiteConfigAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);
  private uploadService = inject(UploadService);

  grupos = GRUPOS_PALETA;

  carregando = false;
  salvando = false;
  erro: string | null = null;
  sucesso = false;
  enviando: Record<string, boolean> = {};

  formulario = this.fb.group({
    logoUrl: [''],
    faviconUrl: [''],
  });

  formularioCores = this.fb.group(
    Object.fromEntries(TODOS_TOKENS_PALETA.map((t) => [t.chave, [t.padrao]])),
  );

  ngOnInit(): void {
    this.carregando = true;
    this.api.obterSingleton<ConfiguracaoSiteAdmin>('configuracao-site').subscribe({
      next: (config) => {
        this.formulario.patchValue({ logoUrl: config.logoUrl ?? '', faviconUrl: config.faviconUrl ?? '' });

        const cores = this.tentarParsear(config.coresJson);
        const valoresIniciais: Record<string, string> = {};
        TODOS_TOKENS_PALETA.forEach((t) => (valoresIniciais[t.chave] = cores[t.chave] && HEX_VALIDO.test(cores[t.chave]) ? cores[t.chave] : t.padrao));
        this.formularioCores.patchValue(valoresIniciais);

        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a configuração do site.';
        this.carregando = false;
      },
    });
  }

  temAlteracoesNaoSalvas(): boolean {
    return this.formulario.dirty || this.formularioCores.dirty;
  }

  @HostListener('window:beforeunload', ['$event'])
  avisarAoFechar(evento: BeforeUnloadEvent): void {
    if (!this.temAlteracoesNaoSalvas()) return;
    evento.preventDefault();
    evento.returnValue = '';
  }

  get previewStyle(): Record<string, string> {
    const estilo: Record<string, string> = {};
    TODOS_TOKENS_PALETA.forEach((t) => {
      const valor = this.formularioCores.value[t.chave];
      estilo[`--${t.chave}`] = valor && HEX_VALIDO.test(valor) ? valor : t.padrao;
    });
    return estilo;
  }

  atualizarHex(chave: string, evento: Event): void {
    const valor = (evento.target as HTMLInputElement).value.trim();
    const normalizado = valor.startsWith('#') ? valor : `#${valor}`;
    if (HEX_VALIDO.test(normalizado)) {
      this.formularioCores.get(chave)?.setValue(normalizado.toLowerCase());
    } else {
      (evento.target as HTMLInputElement).value = this.formularioCores.value[chave] ?? '';
    }
  }

  restaurarCor(token: TokenCor): void {
    this.formularioCores.get(token.chave)?.setValue(token.padrao);
  }

  restaurarCoresPadrao(): void {
    const padroes: Record<string, string> = {};
    TODOS_TOKENS_PALETA.forEach((t) => (padroes[t.chave] = t.padrao));
    this.formularioCores.patchValue(padroes);
  }

  restaurarArquivoPadrao(chave: 'logoUrl' | 'faviconUrl'): void {
    this.formulario.get(chave)?.setValue('');
  }

  selecionarArquivo(event: Event, chave: 'logoUrl' | 'faviconUrl'): void {
    const input = event.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    this.enviando[chave] = true;
    this.uploadService.enviar(arquivo).subscribe({
      next: (url) => {
        this.formulario.patchValue({ [chave]: url });
        this.enviando[chave] = false;
      },
      error: () => {
        this.erro = 'Não foi possível enviar o arquivo.';
        this.enviando[chave] = false;
      },
    });
    input.value = '';
  }

  salvar(): void {
    this.salvando = true;
    this.sucesso = false;
    const payload = {
      ...this.formulario.getRawValue(),
      coresJson: JSON.stringify(this.formularioCores.getRawValue()),
    };
    this.api.atualizarSingleton<ConfiguracaoSiteAdmin>('configuracao-site', payload).subscribe({
      next: () => {
        this.salvando = false;
        this.sucesso = true;
        this.formulario.markAsPristine();
        this.formularioCores.markAsPristine();
      },
      error: () => {
        this.erro = 'Não foi possível salvar.';
        this.salvando = false;
      },
    });
  }

  private tentarParsear(json: string | null): Record<string, string> {
    if (!json) return {};
    try {
      return JSON.parse(json) as Record<string, string>;
    } catch {
      return {};
    }
  }
}
