import { Component, Input, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { TrendingData } from '../../../../core/models/home.model';

@Component({
  selector: 'app-trending-panel',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './trending-panel.component.html',
  styleUrl: './trending-panel.component.scss',
})
export class TrendingPanelComponent {
  private dataInput = signal<TrendingData | null>(null);

  @Input({ required: true })
  set data(value: TrendingData) {
    this.dataInput.set(value);
  }

  /** Sorted by API-provided score and capped to the API-provided limit — the ranking is not hardcoded. */
  ranked = computed(() => {
    const data = this.dataInput();
    if (!data) return [];
    return [...data.items]
      .sort((a, b) => b.score - a.score)
      .slice(0, data.limit)
      .map((item, i) => ({ ...item, rank: i + 1 }));
  });

  label = computed(() => this.dataInput()?.label ?? '');
  linkLabel = computed(() => this.dataInput()?.linkLabel ?? 'Ver todos');
  href = computed(() => this.dataInput()?.href ?? '#');
}
