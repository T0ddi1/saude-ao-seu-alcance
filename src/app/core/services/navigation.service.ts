import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NavItem } from '../models/navigation.model';

/**
 * Reads from a static mock JSON today. To wire up the real API, swap
 * `endpoint` for the backend base URL — the return type/shape stays the same.
 */
@Injectable({ providedIn: 'root' })
export class NavigationService {
  private http = inject(HttpClient);
  private readonly endpoint = 'assets/mock/navigation.json';

  getNavigation(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(this.endpoint);
  }
}
