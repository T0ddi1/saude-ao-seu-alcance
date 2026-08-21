import { Component, ElementRef, HostListener, Input, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { SearchService, SEARCH_MIN_CHARS } from '../../../core/services/search.service';
import { SearchResult } from '../../../core/models/search.model';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-search-box',
  standalone: true,
  imports: [CommonModule, RouterLink, IconComponent],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss',
})
export class SearchBoxComponent implements OnInit, OnDestroy {
  /** Styling context — the mobile panel sits on a solid header background, not a floating bar. */
  @Input() variant: 'header' | 'mobile' = 'header';

  query = signal('');
  results = signal<SearchResult[]>([]);
  isOpen = signal(false);

  private queryChanges = new Subject<string>();

  constructor(
    private router: Router,
    private searchService: SearchService,
    private elementRef: ElementRef<HTMLElement>
  ) {}

  ngOnInit(): void {
    this.queryChanges
      .pipe(
        debounceTime(150),
        distinctUntilChanged(),
        switchMap((value) => this.searchService.search(value))
      )
      .subscribe((results) => {
        this.results.set(results);
        this.isOpen.set(this.query().trim().length >= SEARCH_MIN_CHARS);
      });
  }

  ngOnDestroy(): void {
    this.queryChanges.complete();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query.set(value);
    if (value.trim().length < SEARCH_MIN_CHARS) {
      this.results.set([]);
      this.isOpen.set(false);
    }
    this.queryChanges.next(value);
  }

  onFocus(): void {
    if (this.query().trim().length >= SEARCH_MIN_CHARS) {
      this.isOpen.set(true);
    }
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.goToResultsPage();
  }

  onResultClick(): void {
    this.isOpen.set(false);
  }

  private goToResultsPage(): void {
    const q = this.query().trim();
    if (!q) return;
    this.isOpen.set(false);
    this.router.navigate(['/buscar'], { queryParams: { q } });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.isOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.isOpen.set(false);
  }
}
