import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { InstitutionalPageService } from '../../core/services/institutional-page.service';
import { InstitutionalPageData } from '../../core/models/content.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ContentSidebarComponent } from '../../shared/components/content-sidebar/content-sidebar.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-institutional-page',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent, ContentSidebarComponent, IconComponent],
  templateUrl: './institutional-page.component.html',
  styleUrl: './institutional-page.component.scss',
})
export class InstitutionalPageComponent implements OnInit {
  data = signal<InstitutionalPageData | null>(null);

  constructor(private route: ActivatedRoute, private pageService: InstitutionalPageService) {}

  ngOnInit(): void {
    this.route.data
      .pipe(switchMap((routeData) => this.pageService.getPage(routeData['slug'])))
      .subscribe((data) => this.data.set(data));
  }
}
