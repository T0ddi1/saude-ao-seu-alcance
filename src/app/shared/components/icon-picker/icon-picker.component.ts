import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent, ICONES_DISPONIVEIS, montarIcone, separarIcone } from '../icon/icon.component';

const MINIMO_BUSCA_TODOS = 2;

export const CORES_SUGERIDAS = ['#5c26e4', '#d7b9eb', '#ffffff', '#201238', '#6b6280', '#d64545', '#f5a623', '#f2c94c', '#2fa88a', '#3b82c4', '#e0559b'];

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  templateUrl: './icon-picker.component.html',
  styleUrl: './icon-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => IconPickerComponent),
      multi: true,
    },
  ],
})
export class IconPickerComponent implements ControlValueAccessor {

  @Input() opcoes: string[] = ICONES_DISPONIVEIS;

  aberto = false;
  valor = '';
  nome = '';
  cor: string | null = null;
  readonly coresSugeridas = CORES_SUGERIDAS;
  disabled = false;
  busca = '';
  modoTodos = false;
  carregandoTodos = false;

  private todosOsIcones: string[] | null = null;

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get iconesFiltrados(): string[] {
    const termo = this.busca.trim().toLowerCase();

    if (this.modoTodos) {
      if (!this.todosOsIcones || termo.length < MINIMO_BUSCA_TODOS) return [];
      return this.todosOsIcones.filter((icone) => this.nomeExibicao(icone).includes(termo)).slice(0, 300);
    }

    const lista = this.opcoes?.length ? this.opcoes : ICONES_DISPONIVEIS;
    return termo ? lista.filter((icone) => this.nomeExibicao(icone).includes(termo)) : lista;
  }

  nomeExibicao(icone: string): string {
    const partes = separarIcone(icone).nome.split(' ');
    const ultima = partes[partes.length - 1] ?? icone;
    return ultima.replace(/^fa-/, '');
  }

  abrir(): void {
    if (this.disabled) return;
    this.busca = '';
    this.modoTodos = false;
    this.aberto = true;
  }

  fechar(): void {
    this.aberto = false;
    this.onTouched();
  }

  mostrarTodos(): void {
    this.modoTodos = true;
    this.busca = '';
    if (this.todosOsIcones) return;

    this.carregandoTodos = true;
    import('./font-awesome-todos').then((modulo) => {
      this.todosOsIcones = modulo.FONT_AWESOME_TODOS;
      this.carregandoTodos = false;
    });
  }

  voltarPrincipais(): void {
    this.modoTodos = false;
    this.busca = '';
  }

  escolher(icone: string): void {
    this.nome = icone;
    this.emitir();
    this.fechar();
  }

  escolherCor(cor: string | null): void {
    this.cor = cor;
    if (this.nome) this.emitir();
  }

  aoEscolherCorLivre(evento: Event): void {
    this.escolherCor((evento.target as HTMLInputElement).value);
  }

  private emitir(): void {
    this.valor = montarIcone(this.nome, this.cor);
    this.onChange(this.valor);
  }

  writeValue(value: string): void {
    this.valor = value ?? '';
    const separado = separarIcone(this.valor);
    this.nome = separado.nome;
    this.cor = separado.cor;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
