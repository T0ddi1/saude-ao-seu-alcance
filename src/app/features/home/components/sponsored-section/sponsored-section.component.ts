import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { SponsoredItem, TrustBadge } from '../../../../core/models/home.model';

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
}
