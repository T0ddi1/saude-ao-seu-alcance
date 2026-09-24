import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { TODOS_TOKENS_PALETA } from '../data/paleta-cores';

export interface SiteConfig {
  logoUrl: string | null;
  faviconUrl: string | null;
  coresJson: string | null;
}

@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/configuracao-site`;

  private config$ = this.http.get<SiteConfig>(this.endpoint).pipe(shareReplay(1));

  getConfig(): Observable<SiteConfig> {
    return this.config$;
  }

  aplicarFavicon(faviconUrl: string | null): void {
    if (!faviconUrl) return;
    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (link) link.href = faviconUrl;
  }

  aplicarCores(coresJson: string | null): void {
    if (!coresJson) return;

    let cores: Record<string, string>;
    try {
      cores = JSON.parse(coresJson);
    } catch {
      return;
    }

    const chavesValidas = new Set(TODOS_TOKENS_PALETA.map((t) => t.chave));
    Object.entries(cores).forEach(([chave, valor]) => {
      if (!chavesValidas.has(chave) || !valor || !/^#[0-9a-f]{6}$/i.test(valor)) return;
      document.documentElement.style.setProperty(`--${chave}`, valor);
    });
  }
}
