import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ArticleDetail } from '../models/article.model';

/**
 * Reads a mock JSON per slug today (one GET per article, exactly like the
 * real API will work). To wire up the real API, swap `basePath` for the
 * backend base URL (e.g. `${environment.apiBaseUrl}/articles`) — the
 * return shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class ArticleService {
  private http = inject(HttpClient);
  private readonly basePath = 'assets/mock/articles';

  getArticle(slug: string): Observable<ArticleDetail> {
    return this.http.get<ArticleDetail>(`${this.basePath}/${slug}.json`);
  }
}
