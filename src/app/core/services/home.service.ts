import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HomePageData } from '../models/home.model';

/**
 * Reads from a static mock JSON today. To wire up the real API, swap
 * `endpoint` for the backend base URL (e.g. `${environment.apiBaseUrl}/home`)
 * — the return type/shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private readonly endpoint = 'assets/mock/home.json';

  getHomePage(): Observable<HomePageData> {
    return this.http.get<HomePageData>(this.endpoint);
  }
}
