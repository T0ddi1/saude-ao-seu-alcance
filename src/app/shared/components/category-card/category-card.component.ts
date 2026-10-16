import { Component, Input } from '@angular/core';
import { LinkComQueryDirective } from '../../directives/link-com-query.directive';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IconComponent } from '../icon/icon.component';
import { ContentCard } from '../../../core/models/home.model';

@Component({
  selector: 'app-category-card',
  standalone: true,
  imports: [CommonModule, RouterLink, LinkComQueryDirective, IconComponent],
  templateUrl: './category-card.component.html',
  styleUrl: './category-card.component.scss',
})
export class CategoryCardComponent {
  @Input({ required: true }) card!: ContentCard;
}
