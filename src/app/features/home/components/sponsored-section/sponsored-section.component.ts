import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SponsoredItem, TrustBadge } from '../../../../core/models/home.model';

/** Size tokens the API can send per banner — controls grid-column span out of 6. */
const SIZE_SPAN: Record<string, number> = { sm: 1, md: 2, lg: 3, xl: 6 };

/**
 * Exact rendered pixel size of each slot at our standard desktop width
 * (1280px container, 24px gutter, 6-column grid with 20px gaps) — hand
 * these to marketing so banner art is designed to fill the slot instead
 * of being stretched or cropped. object-fit:cover still absorbs small
 * mismatches, but art built off-spec will crop unpredictably.
 * Export at 2x (e.g. 380×440 for "sm") for retina screens.
 */
export const BANNER_PRESETS: Record<'sm' | 'md' | 'lg' | 'xl', { width: number; height: number; label: string }> = {
  sm: { width: 190, height: 220, label: 'Banner pequeno' },
  md: { width: 400, height: 220, label: 'Banner médio' },
  lg: { width: 610, height: 220, label: 'Banner grande' },
  xl: { width: 1230, height: 220, label: 'Banner full-width' },
};

@Component({
  selector: 'app-sponsored-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './sponsored-section.component.html',
  styleUrl: './sponsored-section.component.scss',
})
export class SponsoredSectionComponent {
  @Input({ required: true }) items!: SponsoredItem[];
  @Input({ required: true }) trustBadges!: TrustBadge[];

  spanFor(item: SponsoredItem): number {
    return SIZE_SPAN[item.size ?? 'md'];
  }
}
