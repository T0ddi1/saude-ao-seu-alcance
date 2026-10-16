import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { RodapeConfigAdminComponent } from './rodape-config-admin.component';
import { RodapeLinksAdminComponent } from './rodape-links-admin.component';
import { RodapeListaAdminComponent } from './rodape-lista-admin.component';

type Aba = 'textos' | 'links' | 'redes' | 'projetos';

/** Tela única do rodapé: textos/newsletter, links por coluna, redes sociais e projetos especiais. */
@Component({
  selector: 'app-rodape-admin',
  standalone: true,
  imports: [CommonModule, RodapeConfigAdminComponent, RodapeLinksAdminComponent, RodapeListaAdminComponent],
  templateUrl: './rodape-admin.component.html',
  styleUrl: './rodape-admin.component.scss',
})
export class RodapeAdminComponent implements ComponenteComAlteracoes {
  @ViewChild(RodapeConfigAdminComponent) private textos?: RodapeConfigAdminComponent;
  @ViewChild(RodapeLinksAdminComponent) private links?: RodapeLinksAdminComponent;
  @ViewChild('redes') private redes?: RodapeListaAdminComponent;
  @ViewChild('projetos') private projetos?: RodapeListaAdminComponent;

  abaAtiva: Aba = 'textos';

  readonly abas: { id: Aba; nome: string; icone: string; descricao: string }[] = [
    { id: 'textos', nome: 'Textos e newsletter', icone: 'fa-align-left', descricao: 'A frase de apresentação e o convite pra newsletter.' },
    { id: 'links', nome: 'Links por coluna', icone: 'fa-link', descricao: 'Os grupos de links do rodapé.' },
    { id: 'redes', nome: 'Redes sociais', icone: 'fa-share-nodes', descricao: 'Os ícones das redes sociais.' },
    { id: 'projetos', nome: 'Projetos especiais', icone: 'fa-heart', descricao: 'Os destaques de projetos do portal.' },
  ];

  temAlteracoesNaoSalvas(): boolean {
    return [this.textos, this.links, this.redes, this.projetos].some((c) => c?.temAlteracoesNaoSalvas());
  }
}
