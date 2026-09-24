import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NavItem } from '../models/navigation.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/navegacao`;

  getNavigation(): Observable<NavItem[]> {
    return this.http.get<NavItem[]>(this.endpoint);
  }
}
