import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-pagination',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
})
export class PaginationComponent {
  @Input({ required: true }) current!: number;
  @Input({ required: true }) total!: number;
  @Output() pageChange = new EventEmitter<number>();

  pages(): number[] {
    return Array.from({ length: this.total }, (_, i) => i + 1);
  }

  go(page: number): void {
    if (page >= 1 && page <= this.total && page !== this.current) {
      this.pageChange.emit(page);
    }
  }
}
