import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.token;
  const ehChamadaDaApi = req.url.startsWith(environment.apiBaseUrl);

  const requisicao = !token || !ehChamadaDaApi
    ? req
    : req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });

  return next(requisicao).pipe(
    catchError((erro: unknown) => {

      if (ehChamadaDaApi && token && erro instanceof HttpErrorResponse && erro.status === 401) {
        authService.encerrarSessaoExpirada();
      }
      return throwError(() => erro);
    }),
  );
};
