import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Perfil, PerfilAtualizar } from '../models/perfil.model';
import { ArticleSummaryApi } from '../models/article-api.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PerfilService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/perfil`;

  obter(): Observable<Perfil> {
    return this.http.get<Perfil>(this.endpoint);
  }

  atualizar(dto: PerfilAtualizar): Observable<Perfil> {
    return this.http.put<Perfil>(this.endpoint, dto);
  }

  favoritos(): Observable<ArticleSummaryApi[]> {
    return this.http.get<ArticleSummaryApi[]>(`${this.endpoint}/favoritos`);
  }
}
