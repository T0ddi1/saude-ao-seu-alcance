import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TrendingItem } from '../../../../core/models/home.model';

@Component({
  selector: 'app-trending-panel',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './trending-panel.component.html',
  styleUrl: './trending-panel.component.scss',
})
export class TrendingPanelComponent {
  @Input({ required: true }) items!: TrendingItem[];
}
