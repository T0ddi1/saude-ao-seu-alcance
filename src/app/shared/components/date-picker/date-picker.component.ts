import { Component, ElementRef, HostListener, Input, forwardRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

interface DiaCalendario {
  iso: string;
  numero: number;
  foraDoMes: boolean;
  hoje: boolean;
  selecionado: boolean;
}

const MESES = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

function paraIso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './date-picker.component.html',
  styleUrl: './date-picker.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true,
    },
  ],
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() placeholder = 'Selecionar data';
  @Input() ariaLabel = 'Escolher data';

  private host = inject(ElementRef<HTMLElement>);

  readonly diasSemana = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  aberto = false;
  disabled = false;
  valor = '';
  mesVisivel = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dias: DiaCalendario[] = [];

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  get textoExibicao(): string {
    if (!this.valor) return '';
    const [a, m, d] = this.valor.split('-');
    return `${d}/${m}/${a}`;
  }

  get tituloMes(): string {
    return `${MESES[this.mesVisivel.getMonth()]} ${this.mesVisivel.getFullYear()}`;
  }

  @HostListener('document:click', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    if (this.aberto && !this.host.nativeElement.contains(evento.target)) this.fechar();
  }

  @HostListener('keydown.escape')
  aoEsc(): void {
    if (this.aberto) this.fechar();
  }

  alternar(): void {
    if (this.disabled) return;
    if (this.aberto) return this.fechar();

    const base = this.valor ? new Date(this.valor + 'T00:00:00') : new Date();
    this.mesVisivel = new Date(base.getFullYear(), base.getMonth(), 1);
    this.montarDias();
    this.aberto = true;
  }

  fechar(): void {
    this.aberto = false;
    this.onTouched();
  }

  mudarMes(delta: number): void {
    this.mesVisivel = new Date(this.mesVisivel.getFullYear(), this.mesVisivel.getMonth() + delta, 1);
    this.montarDias();
  }

  escolher(iso: string): void {
    this.valor = iso;
    this.onChange(iso);
    this.fechar();
  }

  hoje(): void {
    this.escolher(paraIso(new Date()));
  }

  limpar(): void {
    this.valor = '';
    this.onChange('');
    this.fechar();
  }

  writeValue(value: string | null): void {
    this.valor = value ?? '';
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

  private montarDias(): void {
    const ano = this.mesVisivel.getFullYear();
    const mes = this.mesVisivel.getMonth();
    const primeiro = new Date(ano, mes, 1);
    const inicio = new Date(ano, mes, 1 - primeiro.getDay());
    const hojeIso = paraIso(new Date());

    this.dias = Array.from({ length: 42 }, (_, i) => {
      const d = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + i);
      const iso = paraIso(d);
      return { iso, numero: d.getDate(), foraDoMes: d.getMonth() !== mes, hoje: iso === hojeIso, selecionado: iso === this.valor };
    });
  }
}
