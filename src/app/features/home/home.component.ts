import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../core/services/home.service';
import { HomePageData } from '../../core/models/home.model';
import { HeroFeaturedComponent } from './components/hero-featured/hero-featured.component';
import { TrendingPanelComponent } from './components/trending-panel/trending-panel.component';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card.component';
import { HealthDataSectionComponent } from './components/health-data-section/health-data-section.component';
import { SponsoredSectionComponent } from './components/sponsored-section/sponsored-section.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HeroFeaturedComponent,
    TrendingPanelComponent,
    CategoryCardComponent,
    HealthDataSectionComponent,
    SponsoredSectionComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  data = signal<HomePageData | null>(null);

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.homeService.getHomePage().subscribe((data) => this.data.set(data));
  }
}
