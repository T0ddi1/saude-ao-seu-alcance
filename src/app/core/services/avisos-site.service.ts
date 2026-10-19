import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AvisoSitePublico {
  id: number;
  /** Muda quando o aviso é editado — quem marcou "não ver novamente" volta a ver a versão nova. */
  versao: string;
  titulo: string;
  mensagem?: string | null;
  imagemUrl?: string | null;
  somenteImagem: boolean;
  textoBotao?: string | null;
  link?: string | null;
  externo: boolean;
  permiteNaoVerMais: boolean;
}

const CHAVE_OCULTOS = 'sasa_avisos_ocultos'; // localStorage: { [id]: versão } — "não ver novamente"
const CHAVE_VISTOS = 'sasa_avisos_vistos'; // sessionStorage: { [id]: versão } — já fechado nesta visita

type Mapa = Record<string, string>;

@Injectable({ providedIn: 'root' })
export class AvisosSiteService {
  private http = inject(HttpClient);

  /** Se a API falhar, o site simplesmente não mostra aviso nenhum. */
  listarAtivos(): Observable<AvisoSitePublico[]> {
    return this.http.get<AvisoSitePublico[]>(`${environment.apiBaseUrl}/avisos-site`).pipe(catchError(() => of([])));
  }

  /** Devolve só os avisos que ainda devem aparecer pra esta pessoa. */
  pendentes(avisos: AvisoSitePublico[]): AvisoSitePublico[] {
    const ocultos = this.ler(localStorage, CHAVE_OCULTOS);
    const vistos = this.ler(sessionStorage, CHAVE_VISTOS);
    return avisos.filter((a) => ocultos[a.id] !== a.versao && vistos[a.id] !== a.versao);
  }

  marcarVisto(aviso: AvisoSitePublico, naoVerMais: boolean): void {
    this.gravar(sessionStorage, CHAVE_VISTOS, aviso);
    if (naoVerMais && aviso.permiteNaoVerMais) this.gravar(localStorage, CHAVE_OCULTOS, aviso);
  }

  private ler(armazenamento: Storage, chave: string): Mapa {
    try {
      const bruto = armazenamento.getItem(chave);
      return bruto ? (JSON.parse(bruto) as Mapa) : {};
    } catch {
      return {};
    }
  }

  private gravar(armazenamento: Storage, chave: string, aviso: AvisoSitePublico): void {
    try {
      const mapa = this.ler(armazenamento, chave);
      mapa[aviso.id] = aviso.versao;
      armazenamento.setItem(chave, JSON.stringify(mapa));
    } catch {
      /* navegador sem armazenamento (aba privada etc.): o aviso só reaparece na próxima visita */
    }
  }
}
