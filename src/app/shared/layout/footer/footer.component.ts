import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FooterService } from '../../../core/services/footer.service';
import { FooterData, FooterLinkColumn } from '../../../core/models/footer.model';
import { IconComponent, separarIcone } from '../../components/icon/icon.component';
import { NewsletterFormComponent } from '../../components/newsletter-form/newsletter-form.component';
import { AnchorNavService } from '../../../core/services/anchor-nav.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent, NewsletterFormComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  data = signal<FooterData | null>(null);

  constructor(private footerService: FooterService, public anchorNav: AnchorNavService) {}

  ngOnInit(): void {
    this.footerService.getFooterData().subscribe((data) => this.data.set(data));
  }

  corDoProjeto(icone: string): string {
    return separarIcone(icone).cor ?? 'var(--color-secondary)';
  }

  colunasSimples(colunas: FooterLinkColumn[]): FooterLinkColumn[] {
    return colunas.slice(0, -1);
  }

  colunaInstitucional(colunas: FooterLinkColumn[]): FooterLinkColumn | null {
    return colunas.length ? colunas[colunas.length - 1] : null;
  }
}
