import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HomePageData } from '../models/home.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class HomeService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/home`;

  getHomePage(): Observable<HomePageData> {
    return this.http.get<HomePageData>(this.endpoint);
  }
}
