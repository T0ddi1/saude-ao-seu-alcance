import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FooterService } from '../../../core/services/footer.service';
import { FooterData } from '../../../core/models/footer.model';
import { IconComponent } from '../../components/icon/icon.component';
import { NewsletterFormComponent } from '../../components/newsletter-form/newsletter-form.component';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, IconComponent, NewsletterFormComponent],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class FooterComponent implements OnInit {
  data = signal<FooterData | null>(null);

  constructor(private footerService: FooterService) {}

  ngOnInit(): void {
    this.footerService.getFooterData().subscribe((data) => this.data.set(data));
  }
}
