import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SponsoredItem, TrustBadge } from '../../../../core/models/home.model';

/** Size tokens the API can send per banner — controls grid-column span out of 6. */
const SIZE_SPAN: Record<string, number> = { sm: 1, md: 2, lg: 3, xl: 6 };

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
