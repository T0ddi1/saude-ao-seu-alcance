import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type PapelEquipe = 'Admin' | 'Editor';

export interface UsuarioAdmin {
  id: string;
  nomeCompleto: string;
  email: string;
  papel: PapelEquipe;
  ativo: boolean;
  ehVoce: boolean;
}

export interface UsuarioCriadoResposta {
  usuario: UsuarioAdmin;
  emailEnviado: boolean;
}

export interface MinhaConta {
  nomeCompleto: string;
  email: string;
  papel: string;
  emailAvisoComentarios: string;
  emailPersonalizado: boolean;
  avisarComentariosPendentes: boolean;
}

export interface LogAtividade {
  id: number;
  dataHora: string;
  usuarioId?: string | null;
  usuarioNome: string;
  usuarioEmail?: string | null;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  resumo: string;
  alteracoesJson?: string | null;
  ip?: string | null;
}

export interface LogsPagina {
  total: number;
  pagina: number;
  tamanho: number;
  itens: LogAtividade[];
}

export interface LogsFiltros {
  entidades: string[];
  usuarios: { id: string | null; nome: string }[];
}

export interface FiltroLogs {
  usuarioId?: string;
  entidade?: string;
  acao?: string;
  busca?: string;
  de?: string;
  ate?: string;
  pagina?: number;
  tamanho?: number;
}

@Injectable({ providedIn: 'root' })
export class EquipeService {
  private http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/admin`;

  // Usuários do painel (só Admin)
  listarUsuarios(): Observable<UsuarioAdmin[]> {
    return this.http.get<UsuarioAdmin[]>(`${this.base}/usuarios`);
  }
  criarUsuario(dto: { nomeCompleto: string; email: string; papel: PapelEquipe }): Observable<UsuarioCriadoResposta> {
    return this.http.post<UsuarioCriadoResposta>(`${this.base}/usuarios`, dto);
  }
  atualizarUsuario(id: string, dto: { nomeCompleto: string; papel: PapelEquipe; ativo: boolean }): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.base}/usuarios/${id}`, dto);
  }
  enviarRedefinicao(id: string): Observable<{ enviado: boolean }> {
    return this.http.post<{ enviado: boolean }>(`${this.base}/usuarios/${id}/enviar-redefinicao-senha`, {});
  }

  // Minha conta
  minhaConta(): Observable<MinhaConta> {
    return this.http.get<MinhaConta>(`${this.base}/minha-conta`);
  }
  salvarNotificacoes(dto: { emailAvisoComentarios: string | null; avisarComentariosPendentes: boolean }): Observable<MinhaConta> {
    return this.http.put<MinhaConta>(`${this.base}/minha-conta/notificacoes`, dto);
  }
  alterarSenha(dto: { senhaAtual: string; novaSenha: string }): Observable<{ alterada: boolean }> {
    return this.http.post<{ alterada: boolean }>(`${this.base}/minha-conta/alterar-senha`, dto);
  }

  // Log de atividades (só Admin)
  listarLogs(filtro: FiltroLogs): Observable<LogsPagina> {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) {
      if (valor !== undefined && valor !== null && valor !== '') params = params.set(chave, String(valor));
    }
    return this.http.get<LogsPagina>(`${this.base}/logs-atividade`, { params });
  }
  filtrosLogs(): Observable<LogsFiltros> {
    return this.http.get<LogsFiltros>(`${this.base}/logs-atividade/filtros`);
  }

  // Aviso ao entrar no painel
  totalComentariosPendentes(): Observable<{ total: number }> {
    return this.http.get<{ total: number }>(`${this.base}/comentarios/pendentes/total`);
  }
}
