import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { SearchResult } from '../models/search.model';
import { environment } from '../../../environments/environment';

export const SEARCH_MIN_CHARS = 3;

@Injectable({ providedIn: 'root' })
export class SearchService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/busca`;

  search(query: string): Observable<SearchResult[]> {
    const needle = query.trim();
    if (needle.length < SEARCH_MIN_CHARS) return of([]);

    return this.http.get<SearchResult[]>(`${this.endpoint}?q=${encodeURIComponent(needle)}`);
  }
}
