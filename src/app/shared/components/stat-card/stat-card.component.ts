import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HealthStat } from '../../../core/models/home.model';

@Component({
  selector: 'app-stat-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './stat-card.component.html',
  styleUrl: './stat-card.component.scss',
})
export class StatCardComponent {
  @Input({ required: true }) stat!: HealthStat;
  @Input() variant: 'filled' | 'outline' = 'outline';
}
