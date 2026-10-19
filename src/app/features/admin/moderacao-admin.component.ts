import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AdminApiService } from '../../core/services/admin-api.service';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ComentarioAdmin } from '../../core/models/admin.model';
import { ComentariosAdminComponent } from './comentarios-admin.component';
import { ConfigLista, ListaCadastroAdminComponent } from './lista-cadastro-admin.component';
import { AvisoComentariosEmailComponent } from '../../shared/components/aviso-comentarios-email/aviso-comentarios-email.component';

type Aba = 'comentarios' | 'palavras';

/** Tela única de moderação: os comentários dos leitores e a lista de palavras que bloqueiam um comentário automaticamente. */
@Component({
  selector: 'app-moderacao-admin',
  standalone: true,
  imports: [CommonModule, ComentariosAdminComponent, ListaCadastroAdminComponent, AvisoComentariosEmailComponent],
  templateUrl: './moderacao-admin.component.html',
  styleUrl: './moderacao-admin.component.scss',
})
export class ModeracaoAdminComponent implements OnInit, ComponenteComAlteracoes {
  private api = inject(AdminApiService);

  @ViewChild(ListaCadastroAdminComponent) private palavras?: ListaCadastroAdminComponent;

  abaAtiva: Aba = 'comentarios';
  pendentes = 0;

  readonly configPalavras: ConfigLista = {
    recurso: 'palavras-bloqueadas',
    rotuloItem: 'palavra',
    explicacao:
      'Comentários que contenham qualquer uma destas palavras ou termos são bloqueados automaticamente (spam, ofensas, termos sensíveis). Use o olho pra pausar uma palavra sem apagar.',
    campos: [{ chave: 'texto', rotulo: 'Palavra ou termo', obrigatorio: true, placeholder: 'Ex: palavrão, link suspeito' }],
    campoTitulo: 'texto',
    reordenavel: false,
  };

  ngOnInit(): void {
    this.api.listarComQuery<ComentarioAdmin>('comentarios', 'status=pendente').subscribe((itens) => (this.pendentes = itens.length));
  }

  temAlteracoesNaoSalvas(): boolean {
    return !!this.palavras?.temAlteracoesNaoSalvas();
  }
}
