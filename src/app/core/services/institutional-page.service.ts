import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InstitutionalPageData } from '../models/content.model';

/**
 * Reads from a static mock JSON per slug today. To wire up the real API,
 * swap `basePath` for the backend base URL — the return shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionalPageService {
  private http = inject(HttpClient);
  private readonly basePath = 'assets/mock/pages';

  getPage(slug: string): Observable<InstitutionalPageData> {
    return this.http.get<InstitutionalPageData>(`${this.basePath}/${slug}.json`);
  }
}
