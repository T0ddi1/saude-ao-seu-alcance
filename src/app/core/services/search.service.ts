import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { SearchResult } from '../models/search.model';

/** Minimum characters before a query is considered searchable. */
export const SEARCH_MIN_CHARS = 3;

/**
 * Reads the full mock index once and filters client-side. To wire up the
 * real API, swap this for a debounced HTTP call per query
 * (e.g. `${environment.apiBaseUrl}/search?q=...`) — callers only depend on
 * `search()`, so the swap is contained here.
 */
@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private readonly endpoint = 'assets/mock/search-index.json';

  private index$ = this.http.get<SearchResult[]>(this.endpoint).pipe(shareReplay(1));

  search(query: string): Observable<SearchResult[]> {
    const needle = query.trim().toLowerCase();
    return this.index$.pipe(
      map((items) =>
        needle.length < SEARCH_MIN_CHARS
          ? []
          : items.filter(
              (item) => item.title.toLowerCase().includes(needle) || item.excerpt.toLowerCase().includes(needle)
            )
      )
    );
  }
}
