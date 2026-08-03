import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FooterData } from '../models/footer.model';

@Injectable({ providedIn: 'root' })
export class FooterService {
  private http = inject(HttpClient);
  private readonly endpoint = 'assets/mock/footer.json';

  getFooterData(): Observable<FooterData> {
    return this.http.get<FooterData>(this.endpoint);
  }
}
