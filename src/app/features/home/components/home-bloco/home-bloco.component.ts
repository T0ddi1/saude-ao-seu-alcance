import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BlocoHome } from '../../../../core/models/home.model';
import { HeroFeaturedComponent } from '../hero-featured/hero-featured.component';
import { TrendingPanelComponent } from '../trending-panel/trending-panel.component';
import { HealthDataSectionComponent } from '../health-data-section/health-data-section.component';
import { SponsoredSectionComponent } from '../sponsored-section/sponsored-section.component';
import { CategoryCardComponent } from '../../../../shared/components/category-card/category-card.component';

/** Desenha um bloco da Home. Usado pela página inicial e pelo preview do admin, pra os dois ficarem idênticos. */
@Component({
  selector: 'app-home-bloco',
  standalone: true,
  imports: [
    CommonModule,
    HeroFeaturedComponent,
    TrendingPanelComponent,
    HealthDataSectionComponent,
    SponsoredSectionComponent,
    CategoryCardComponent,
  ],
  templateUrl: './home-bloco.component.html',
  styleUrl: './home-bloco.component.scss',
})
export class HomeBlocoComponent {
  @Input({ required: true }) bloco!: BlocoHome;
}
