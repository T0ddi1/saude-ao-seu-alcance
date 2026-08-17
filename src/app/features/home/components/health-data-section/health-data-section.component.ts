import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../../../shared/components/icon/icon.component';
import { HomePageData } from '../../../../core/models/home.model';

@Component({
  selector: 'app-health-data-section',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './health-data-section.component.html',
  styleUrl: './health-data-section.component.scss',
})
export class HealthDataSectionComponent {
  @Input({ required: true }) healthStats!: HomePageData['healthStats'];
  @Input({ required: true }) contentCategories!: HomePageData['contentCategories'];

  /** The grid is fixed at 2 columns; a trailing odd-one-out spans both so it doesn't sit alone in a half-empty row. */
  isLastOddStat(index: number): boolean {
    const count = this.healthStats.stats.length;
    return count % 2 !== 0 && index === count - 1;
  }

  /**
   * Modular category columns: 1 category fills the whole row (reads as
   * "big"), 2 split it evenly ("medium"), 3 keeps the usual three-up
   * layout. Above 3 the API would just get extra rows of 3 — this block
   * wasn't designed to fit more than that in one row.
   */
  get categoryColumns(): number {
    return Math.min(this.contentCategories.length, 3) || 1;
  }
}
