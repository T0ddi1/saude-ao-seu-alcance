import { Component, Input } from '@angular/core';
import { LinkComQueryDirective } from '../../../../shared/directives/link-com-query.directive';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SponsoredItem, TrustBadge } from '../../../../core/models/home.model';
import { corDoTextoSobre, ehCorValida } from '../../../../shared/utils/cor.util';


const SIZE_SPAN: Record<string, number> = { sm: 1, md: 2, lg: 3, xl: 6 };


export const BANNER_PRESETS: Record<'sm' | 'md' | 'lg' | 'xl', { width: number; height: number; label: string }> = {
  sm: { width: 190, height: 220, label: 'Banner pequeno' },
  md: { width: 400, height: 220, label: 'Banner médio' },
  lg: { width: 610, height: 220, label: 'Banner grande' },
  xl: { width: 1230, height: 220, label: 'Banner full-width' },
};

@Component({
  selector: 'app-sponsored-section',
  standalone: true,
  imports: [CommonModule, RouterLink, LinkComQueryDirective, IconComponent],
  templateUrl: './sponsored-section.component.html',
  styleUrl: './sponsored-section.component.scss',
})
export class SponsoredSectionComponent {
  @Input() items: SponsoredItem[] = [];
  @Input() trustBadges: TrustBadge[] = [];

  /** Cor de fundo personalizada do card "Cor da marca" (só vale se for um #RRGGBB válido). */
  corFundo(item: SponsoredItem): string | null {
    return item.theme === 'brand' && ehCorValida(item.backgroundColor) ? item.backgroundColor : null;
  }

  /** Texto branco ou preto, conforme o contraste com a cor escolhida. */
  corTexto(item: SponsoredItem): string | null {
    const fundo = this.corFundo(item);
    return fundo ? corDoTextoSobre(fundo) : null;
  }

  spanFor(item: SponsoredItem): number {
    return SIZE_SPAN[item.size ?? 'md'];
  }
}
