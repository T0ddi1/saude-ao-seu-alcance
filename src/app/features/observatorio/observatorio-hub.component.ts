import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ObservatorioService } from '../../core/services/observatorio.service';
import { SeoService } from '../../core/services/seo.service';
import { ObservatorioHubData, SecaoObservatorioResumo } from '../../core/models/observatorio.model';
import { ContentCard, IconGlyph } from '../../core/models/home.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { CategoryCardComponent } from '../../shared/components/category-card/category-card.component';
import { ArticleCardComponent } from '../blog/components/article-card/article-card.component';

@Component({
  selector: 'app-observatorio-hub',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, IconComponent, CategoryCardComponent, ArticleCardComponent],
  templateUrl: './observatorio-hub.component.html',
  styleUrl: './observatorio-hub.component.scss',
})
export class ObservatorioHubComponent implements OnInit {
  data = signal<ObservatorioHubData | null>(null);

  constructor(private observatorioService: ObservatorioService, private seo: SeoService) {}

  ngOnInit(): void {
    this.seo.setMeta({
      title: 'Observatório',
      description: 'O Observatório do Saúde ao Seu Alcance acompanha o sistema de saúde, o mercado, a inovação e os dados que movem o setor no Brasil.',
    });

    this.observatorioService.getHub().subscribe((data) => this.data.set(data));
  }

  paraCard(secao: SecaoObservatorioResumo): ContentCard {
    return {
      // O ícone vem do admin em formato livre ("fa-solid fa-x|#hex"); o app-icon
      // aceita qualquer string, só o tipo ContentCard.icon é que é restrito.
      icon: (secao.icone ?? 'dot') as IconGlyph,
      title: secao.nome,
      image: null,
      excerpt: secao.resumo ?? '',
      linkLabel: 'Explorar',
      href: `/observatorio/${secao.slug}`,
    };
  }
}
