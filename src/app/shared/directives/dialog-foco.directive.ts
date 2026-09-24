import { AfterViewInit, Directive, ElementRef, HostListener, OnDestroy } from '@angular/core';

const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

@Directive({
  selector: '[appDialogFoco]',
  standalone: true,
})
export class DialogFocoDirective implements AfterViewInit, OnDestroy {
  private anterior: HTMLElement | null = document.activeElement as HTMLElement | null;

  constructor(private el: ElementRef<HTMLElement>) {}

  ngAfterViewInit(): void {
    const raiz = this.el.nativeElement;
    const alvo = raiz.querySelector<HTMLElement>('input:not([type="checkbox"]), select, textarea') ?? raiz.querySelector<HTMLElement>(FOCAVEIS);
    (alvo ?? raiz).focus();
  }

  ngOnDestroy(): void {
    this.anterior?.focus?.();
  }

  @HostListener('keydown', ['$event'])
  prenderFoco(evento: KeyboardEvent): void {
    if (evento.key !== 'Tab') return;

    const itens = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(FOCAVEIS)).filter((e) => e.offsetParent !== null);
    if (!itens.length) return;

    const primeiro = itens[0];
    const ultimo = itens[itens.length - 1];
    const ativo = document.activeElement;

    if (evento.shiftKey && (ativo === primeiro || ativo === this.el.nativeElement)) {
      evento.preventDefault();
      ultimo.focus();
    } else if (!evento.shiftKey && ativo === ultimo) {
      evento.preventDefault();
      primeiro.focus();
    }
  }
}
