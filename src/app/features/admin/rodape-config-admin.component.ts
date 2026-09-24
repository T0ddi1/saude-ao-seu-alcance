import { Component, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';

interface ConfiguracaoRodapeAdmin {
  id: number;
  tagline: string;
  newsletterTitulo: string;
  newsletterDescricao: string;
  newsletterPlaceholder: string;
  newsletterCta: string;
}

@Component({
  selector: 'app-rodape-config-admin',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './rodape-config-admin.component.html',
  styleUrl: './rodape-config-admin.component.scss',
})
export class RodapeConfigAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);
  private fb = inject(FormBuilder);

  carregando = false;
  salvando = false;
  erro: string | null = null;
  sucesso = false;

  formulario = this.fb.group({
    tagline: ['', Validators.required],
    newsletterTitulo: ['', Validators.required],
    newsletterDescricao: [''],
    newsletterPlaceholder: [''],
    newsletterCta: [''],
  });

  ngOnInit(): void {
    this.carregando = true;
    this.api.obterSingleton<ConfiguracaoRodapeAdmin>('configuracao-rodape').subscribe({
      next: (config) => {
        this.formulario.patchValue(config);
        this.carregando = false;
      },
      error: () => {
        this.erro = 'Não foi possível carregar a configuração do rodapé.';
        this.carregando = false;
      },
    });
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

  salvar(): void {
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    this.salvando = true;
    this.sucesso = false;
    this.api.atualizarSingleton<ConfiguracaoRodapeAdmin>('configuracao-rodape', this.formulario.getRawValue()).subscribe({
      next: () => {
        this.salvando = false;
        this.sucesso = true;
        this.formulario.markAsPristine();
      },
      error: () => {
        this.erro = 'Não foi possível salvar.';
        this.salvando = false;
      },
    });
  }
}
