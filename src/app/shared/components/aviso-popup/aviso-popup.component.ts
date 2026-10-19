import { Component, ElementRef, HostListener, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AvisoSitePublico, AvisosSiteService } from '../../../core/services/avisos-site.service';
import { TotemService } from '../../../core/services/totem.service';

@Component({
  selector: 'app-aviso-popup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './aviso-popup.component.html',
  styleUrl: './aviso-popup.component.scss',
})
export class AvisoPopupComponent implements OnInit {
  private servico = inject(AvisosSiteService);
  private totem = inject(TotemService);

  /** Fila de avisos que ainda faltam mostrar; o primeiro é o que está na tela. */
  fila = signal<AvisoSitePublico[]>([]);
  naoVerMais = false;

  @ViewChild('botaoFechar') set botaoFechar(el: ElementRef<HTMLButtonElement> | undefined) {
    // Ao abrir, o foco vai pro botão de fechar (acessibilidade e Esc funcionando).
    if (el) setTimeout(() => el.nativeElement.focus({ preventScroll: true }));
  }

  ngOnInit(): void {
    // No totem não há teclado nem ninguém pra fechar um popup: não exibe.
    if (this.totem.isTotem()) return;
    this.servico.listarAtivos().subscribe((avisos) => this.fila.set(this.servico.pendentes(avisos)));
  }

  get atual(): AvisoSitePublico | null {
    return this.fila()[0] ?? null;
  }

  get externo(): boolean {
    return !!this.atual?.externo || /^https?:\/\//i.test(this.atual?.link ?? '');
  }

  /** Só fecha quando o clique é no fundo escuro. Não pode ser uma expressão `a && b` no template: o Angular trata `false` como preventDefault e os campos do popup perdem o foco. */
  aoPressionarFundo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.fechar();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.atual) this.fechar();
  }

  fechar(): void {
    const aviso = this.atual;
    if (!aviso) return;
    this.servico.marcarVisto(aviso, this.naoVerMais);
    this.naoVerMais = false;
    this.fila.update((f) => f.slice(1));
  }
}
