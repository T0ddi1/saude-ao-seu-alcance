import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ObservatorioService } from '../../core/services/observatorio.service';
import { SeoService } from '../../core/services/seo.service';
import { ObservatorioSecaoData } from '../../core/models/observatorio.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { ArticleCardComponent } from '../blog/components/article-card/article-card.component';

@Component({
  selector: 'app-observatorio-secao',
  standalone: true,
  imports: [CommonModule, RouterLink, BreadcrumbComponent, IconComponent, ArticleCardComponent],
  templateUrl: './observatorio-secao.component.html',
  styleUrl: './observatorio-secao.component.scss',
})
export class ObservatorioSecaoComponent implements OnInit {
  data = signal<ObservatorioSecaoData | null>(null);

  constructor(
    private route: ActivatedRoute,
    private observatorioService: ObservatorioService,
    private seo: SeoService,
  ) {}

  ngOnInit(): void {
    this.route.paramMap
      .pipe(switchMap((params) => this.observatorioService.getSecao(params.get('secao') ?? '')))
      .subscribe((data) => {
        this.data.set(data);
        this.seo.setMeta({
          title: `Observatório — ${data.nome}`,
          description: data.resumo ?? `${data.nome} — Observatório do Saúde ao Seu Alcance.`,
        });
      });
  }
}
