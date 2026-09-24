import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ContactOption {
  id: number;
  name: string;
}

export interface ContactOptions {
  specialties: ContactOption[];
  sources: ContactOption[];
  interestTypes: ContactOption[];
}

export interface ContactSubmission {
  fullName: string;
  email: string;
  phone: string;
  specialtyId: number;
  sourceId: number;
  interestTypeId: number;
  state: string;
  city: string;
  message?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

const UTM_STORAGE_KEY = 'saude-utm';
const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign'] as const;

@Injectable({ providedIn: 'root' })
export class ContatoService {
  private http = inject(HttpClient);

  getOptions(): Observable<ContactOptions> {
    return this.http.get<ContactOptions>(`${environment.apiBaseUrl}/contato/opcoes`);
  }

  submit(payload: ContactSubmission): Observable<{ received: boolean }> {
    return this.http.post<{ received: boolean }>(`${environment.apiBaseUrl}/contato/leads`, payload);
  }

  getCities(uf: string): Observable<string[]> {
    return this.http
      .get<{ nome: string }[]>(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .pipe(map((cities) => cities.map((c) => c.nome)));
  }

  captureUtm(): void {
    try {
      const params = new URLSearchParams(window.location.search);
      const hashQuery = window.location.hash.split('?')[1];
      if (hashQuery) new URLSearchParams(hashQuery).forEach((value, key) => params.set(key, value));

      const found: Record<string, string> = {};
      UTM_KEYS.forEach((key) => {
        const value = params.get(key);
        if (value) found[key] = value;
      });

      if (Object.keys(found).length) sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(found));
    } catch {
      return;
    }
  }

  getUtm(): { utmSource?: string; utmMedium?: string; utmCampaign?: string } {
    this.captureUtm();
    try {
      const saved = JSON.parse(sessionStorage.getItem(UTM_STORAGE_KEY) ?? '{}') as Record<string, string>;
      return { utmSource: saved['utm_source'], utmMedium: saved['utm_medium'], utmCampaign: saved['utm_campaign'] };
    } catch {
      return {};
    }
  }
}
