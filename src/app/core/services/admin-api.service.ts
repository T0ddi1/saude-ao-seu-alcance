import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin`;

  listar<T>(recurso: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}/${recurso}`);
  }

  listarComQuery<T>(recurso: string, query: string): Observable<T[]> {
    return this.http.get<T[]>(`${this.base}/${recurso}?${query}`);
  }

  obterComQuery<T>(recurso: string, query: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${recurso}?${query}`);
  }

  obter<T>(recurso: string, id: number): Observable<T> {
    return this.http.get<T>(`${this.base}/${recurso}/${id}`);
  }

  obterSingleton<T>(recurso: string): Observable<T> {
    return this.http.get<T>(`${this.base}/${recurso}`);
  }

  atualizarSingleton<T>(recurso: string, payload: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${recurso}`, payload);
  }

  criar<T>(recurso: string, payload: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${recurso}`, payload);
  }

  atualizar<T>(recurso: string, id: number, payload: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${recurso}/${id}`, payload);
  }

  atualizarPorChave<T>(recurso: string, chave: string, payload: unknown): Observable<T> {
    return this.http.put<T>(`${this.base}/${recurso}/${chave}`, payload);
  }

  excluir(recurso: string, id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${recurso}/${id}`);
  }

  acao<T>(recurso: string, id: number, acao: string): Observable<T> {
    return this.http.post<T>(`${this.base}/${recurso}/${id}/${acao}`, {});
  }

  acaoComBody<T>(recurso: string, id: number, acao: string, payload: unknown): Observable<T> {
    return this.http.post<T>(`${this.base}/${recurso}/${id}/${acao}`, payload);
  }
}
