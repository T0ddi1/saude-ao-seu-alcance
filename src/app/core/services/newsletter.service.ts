import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface NewsletterTopic {
  nome: string;
  slug: string;
}

export interface NewsletterSubscription {
  email: string;
  allTopics: boolean;
  topics: string[];
  acceptedCommunications: boolean;
  source: string;
  name?: string;
  phone?: string;
  latitude?: number;
  longitude?: number;
}

@Injectable({ providedIn: 'root' })
export class NewsletterService {
  private http = inject(HttpClient);

  listTopics(): Observable<NewsletterTopic[]> {
    return this.http.get<NewsletterTopic[]>(`${environment.apiBaseUrl}/categorias`);
  }

  subscribe(payload: NewsletterSubscription): Observable<{ subscribed: boolean }> {
    return this.http.post<{ subscribed: boolean }>(`${environment.apiBaseUrl}/newsletter/inscricoes`, payload);
  }
}
