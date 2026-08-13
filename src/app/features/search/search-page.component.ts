import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { switchMap } from 'rxjs';
import { SearchService, SEARCH_MIN_CHARS } from '../../core/services/search.service';
import { SearchResult } from '../../core/models/search.model';
import { BreadcrumbComponent } from '../../shared/components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, BreadcrumbComponent],
  templateUrl: './search-page.component.html',
  styleUrl: './search-page.component.scss',
})
export class SearchPageComponent implements OnInit {
  query = signal('');
  results = signal<SearchResult[]>([]);
  readonly minChars = SEARCH_MIN_CHARS;

  breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Busca', href: '/buscar' },
  ];

  constructor(private route: ActivatedRoute, private searchService: SearchService) {}

  ngOnInit(): void {
    this.route.queryParamMap
      .pipe(switchMap((params) => {
        const q = params.get('q') ?? '';
        this.query.set(q);
        return this.searchService.search(q);
      }))
      .subscribe((results) => this.results.set(results));
  }
}
