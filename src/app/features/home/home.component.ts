import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeService } from '../../core/services/home.service';
import { SeoService } from '../../core/services/seo.service';
import { BlocoHome, HomePageData } from '../../core/models/home.model';
import { HomeBlocoComponent } from './components/home-bloco/home-bloco.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, HomeBlocoComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  data = signal<HomePageData | null>(null);

  constructor(private homeService: HomeService, private seo: SeoService) {}

  porId(_: number, bloco: BlocoHome): number {
    return bloco.id;
  }

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Saúde ao Seu Alcance',
      description: 'Notícias, orientações e conteúdo confiável sobre saúde, bem-estar e qualidade de vida para todo o Brasil.',
    });
    this.homeService.getHomePage().subscribe((data) => this.data.set(data));
  }
}
