import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Dica padronizada pra qualquer lugar do painel que envia imagem: mostra o tamanho/proporção ideal
 * (pra imagem não ficar cortada ou borrada) e os formatos aceitos pelo servidor.
 */
@Component({
  selector: 'app-dica-imagem',
  standalone: true,
  imports: [CommonModule],
  template: `
    <p class="dica-imagem">
      <i class="fa-solid fa-ruler-combined" aria-hidden="true"></i>
      <span>
        <ng-container *ngIf="medida">{{ medida }} </ng-container>
        <strong>{{ formatos }}</strong>
      </span>
    </p>
  `,
  styles: [
    `
      .dica-imagem {
        display: flex;
        gap: 8px;
        align-items: flex-start;
        margin: 6px 0 0;
        font-size: 12px;
        line-height: 1.45;
        color: var(--adm-muted, #6b6b6b);
      }
      .dica-imagem i {
        margin-top: 2px;
        color: var(--adm-accent, #5c26e4);
      }
      .dica-imagem strong {
        font-weight: 600;
        color: var(--adm-ink, #1e1e1e);
      }
    `,
  ],
})
export class DicaImagemComponent {
  /** O que vale pra esse campo: onde a imagem aparece, tamanho e proporção ideais. */
  @Input() medida = '';
  /** 'imagem' (JPG/PNG/WebP/GIF) ou 'arquivo' (PDF ou imagem). */
  @Input() tipo: 'imagem' | 'arquivo' = 'imagem';

  get formatos(): string {
    return this.tipo === 'arquivo' ? 'Aceita PDF, JPG, PNG, WebP ou GIF, até 10 MB.' : 'Aceita JPG, PNG, WebP ou GIF, até 10 MB.';
  }
}
