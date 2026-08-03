import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ContentCard } from '../../../core/models/home.model';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
})
export class CategoryCardComponent {
  @Input({ required: true }) card!: ContentCard;
}
