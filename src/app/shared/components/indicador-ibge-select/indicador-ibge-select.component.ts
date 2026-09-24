import { Component, OnInit, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { AdminApiService } from '../../../core/services/admin-api.service';
import { IndicadorIbgeOpcao } from '../../../core/models/admin.model';

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
export class IndicadorIbgeSelectComponent implements ControlValueAccessor, OnInit {
  private api = inject(AdminApiService);

  opcoes: IndicadorIbgeOpcao[] = [];
  aberto = false;
  valor: string | null = null;
  disabled = false;
  busca = '';

  private onChange: (value: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  ngOnInit(): void {
    this.api.listar<IndicadorIbgeOpcao>('indicadores-ibge').subscribe((opcoes) => (this.opcoes = opcoes));
  }

  get opcoesFiltradas(): IndicadorIbgeOpcao[] {
    const termo = this.busca.trim().toLowerCase();
    return termo ? this.opcoes.filter((o) => o.rotulo.toLowerCase().includes(termo)) : this.opcoes;
  }

  get rotuloSelecionado(): string | null {
    return this.opcoes.find((o) => o.chave === this.valor)?.rotulo ?? null;
  }

  abrir(): void {
    if (this.disabled) return;
    this.busca = '';
    this.aberto = true;
  }

  fechar(): void {
    this.aberto = false;
    this.onTouched();
  }

  escolher(chave: string | null): void {
    this.valor = chave;
    this.onChange(chave);
    this.fechar();
  }

  writeValue(value: string | null): void {
    this.valor = value ?? null;
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
