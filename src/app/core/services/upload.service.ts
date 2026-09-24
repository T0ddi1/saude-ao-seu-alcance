import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private http = inject(HttpClient);
  private readonly endpoint = `${environment.apiBaseUrl}/uploads`;

  enviar(arquivo: File): Observable<string> {
    const formData = new FormData();
    formData.append('arquivo', arquivo);

    return this.http
      .post<{ url: string }>(this.endpoint, formData)
      .pipe(map((resposta) => `${environment.apiOrigin}${resposta.url}`));
  }
}
