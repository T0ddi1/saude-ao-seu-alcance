import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse } from '../models/admin.model';
import { environment } from '../../../environments/environment';
import { ToastService } from './toast.service';

const TOKEN_KEY = 'sasa_admin_token';
const USER_KEY = 'sasa_admin_user';

const ATRASO_MAXIMO_MS = 2 ** 31 - 1;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toast = inject(ToastService);
  private readonly endpoint = `${environment.apiBaseUrl}/auth`;

  usuario = signal<LoginResponse | null>(this.lerUsuarioArmazenado());

  private timerExpiracao: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.agendarLogoutAutomatico();
  }

  login(dto: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.endpoint}/login`, dto).pipe(
      tap((resposta) => this.armazenarSessao(resposta)),
    );
  }

  esqueciSenha(email: string): Observable<{ mensagem: string }> {
    return this.http.post<{ mensagem: string }>(`${this.endpoint}/esqueci-senha`, { email });
  }

  redefinirSenha(usuarioId: string, token: string, novaSenha: string): Observable<{ redefinido: boolean }> {
    return this.http.post<{ redefinido: boolean }>(`${this.endpoint}/redefinir-senha`, { usuarioId, token, novaSenha });
  }

  descadastrar(usuarioId: string, token: string): Observable<{ descadastrado: boolean }> {
    return this.http.post<{ descadastrado: boolean }>(`${this.endpoint}/descadastrar?usuarioId=${encodeURIComponent(usuarioId)}&token=${encodeURIComponent(token)}`, {});
  }

  confirmarEmail(usuarioId: string, token: string): Observable<{ confirmado: boolean }> {
    return this.http.post<{ confirmado: boolean }>(`${this.endpoint}/confirmar-email?usuarioId=${encodeURIComponent(usuarioId)}&token=${encodeURIComponent(token)}`, {});
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.usuario.set(null);
    this.cancelarLogoutAutomatico();
  }

  encerrarSessaoExpirada(): void {
    if (!this.estaLogado) return;
    this.logout();
    this.toast.show('Sua sessão expirou. Faça login novamente.');
    this.router.navigate(['/admin/login']);
  }

  get token(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  get estaLogado(): boolean {
    return !!this.token;
  }

  get ehAdmin(): boolean {
    return this.usuario()?.papeis?.includes('Admin') ?? false;
  }

  get ehStaff(): boolean {
    const papeis = this.usuario()?.papeis ?? [];
    return papeis.includes('Admin') || papeis.includes('Editor');
  }

  private armazenarSessao(resposta: LoginResponse): void {
    localStorage.setItem(TOKEN_KEY, resposta.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(resposta));
    this.usuario.set(resposta);
    this.agendarLogoutAutomatico();
  }

  private lerUsuarioArmazenado(): LoginResponse | null {
    try {
      const bruto = localStorage.getItem(USER_KEY);
      return bruto ? (JSON.parse(bruto) as LoginResponse) : null;
    } catch {
      return null;
    }
  }

  private agendarLogoutAutomatico(): void {
    this.cancelarLogoutAutomatico();

    const expiracaoMs = this.obterExpiracaoDoToken();
    if (expiracaoMs === null) return;

    const restanteMs = expiracaoMs - Date.now();
    if (restanteMs <= 0) {
      this.encerrarSessaoExpirada();
      return;
    }

    this.timerExpiracao = setTimeout(() => this.encerrarSessaoExpirada(), Math.min(restanteMs, ATRASO_MAXIMO_MS));
  }

  private cancelarLogoutAutomatico(): void {
    if (this.timerExpiracao) {
      clearTimeout(this.timerExpiracao);
      this.timerExpiracao = null;
    }
  }

  private obterExpiracaoDoToken(): number | null {
    const token = this.token;
    if (!token) return null;

    try {
      const payloadBase64 = token.split('.')[1];
      const payloadJson = atob(payloadBase64.replace(/-/g, '+').replace(/_/g, '/'));
      const payload = JSON.parse(payloadJson) as { exp?: number };
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }
}
