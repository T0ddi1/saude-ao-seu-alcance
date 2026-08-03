import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BlogPageData } from '../models/blog.model';

/**
 * Reads from a static mock JSON today. To wire up the real API, swap
 * `endpoint` for the backend base URL (e.g. `${environment.apiBaseUrl}/blog`)
 * — the return type/shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private readonly endpoint = 'assets/mock/blog.json';

  getBlogPage(): Observable<BlogPageData> {
    return this.http.get<BlogPageData>(this.endpoint);
  }
}
