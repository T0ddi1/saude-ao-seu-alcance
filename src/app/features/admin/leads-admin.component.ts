import { Component, QueryList, ViewChildren } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ComponenteComAlteracoes } from '../../core/guards/alteracoes-nao-salvas.guard';
import { ConfigLista, ListaCadastroAdminComponent } from './lista-cadastro-admin.component';

type Aba = 'especialidades' | 'origens' | 'interesses' | 'campanhas';

/** Tela única dos cadastros de leads: as listas que aparecem nos formulários e as campanhas de rastreamento. */
@Component({
  selector: 'app-leads-admin',
  standalone: true,
  imports: [CommonModule, ListaCadastroAdminComponent],
  templateUrl: './leads-admin.component.html',
  styleUrl: './leads-admin.component.scss',
})
export class LeadsAdminComponent implements ComponenteComAlteracoes {
  @ViewChildren(ListaCadastroAdminComponent) private listas?: QueryList<ListaCadastroAdminComponent>;

  abaAtiva: Aba = 'especialidades';

  readonly abas: { id: Aba; nome: string; icone: string; descricao: string; config: ConfigLista }[] = [
    {
      id: 'especialidades',
      nome: 'Especialidades',
      icone: 'fa-user-doctor',
      descricao: 'Opções de especialidade médica nos formulários.',
      config: {
        recurso: 'especialidades',
        rotuloItem: 'especialidade',
        explicacao: 'As especialidades que a pessoa pode escolher ao se cadastrar na newsletter ou no contato. Arraste pra definir a ordem da lista.',
        campos: [{ chave: 'nome', rotulo: 'Nome da especialidade', obrigatorio: true, placeholder: 'Ex: Cardiologia' }],
        campoTitulo: 'nome',
        reordenavel: true,
      },
    },
    {
      id: 'origens',
      nome: 'Origens do lead',
      icone: 'fa-location-crosshairs',
      descricao: 'As respostas de "De onde você veio?".',
      config: {
        recurso: 'origens-lead',
        rotuloItem: 'origem',
        explicacao: 'As opções da pergunta "De onde você veio?" nos formulários. Arraste pra definir a ordem da lista.',
        campos: [{ chave: 'nome', rotulo: 'Nome da origem', obrigatorio: true, placeholder: 'Ex: Instagram' }],
        campoTitulo: 'nome',
        reordenavel: true,
      },
    },
    {
      id: 'interesses',
      nome: 'Tipos de interesse',
      icone: 'fa-bullseye',
      descricao: 'O que a pessoa quer receber ou saber.',
      config: {
        recurso: 'tipos-interesse',
        rotuloItem: 'tipo de interesse',
        explicacao: 'Os assuntos que a pessoa pode marcar como interesse nos formulários. Arraste pra definir a ordem da lista.',
        campos: [{ chave: 'nome', rotulo: 'Nome do interesse', obrigatorio: true, placeholder: 'Ex: Saúde da mulher' }],
        campoTitulo: 'nome',
        reordenavel: true,
      },
    },
    {
      id: 'campanhas',
      nome: 'Campanhas (UTM)',
      icone: 'fa-bullhorn',
      descricao: 'Rastreio de onde cada lead veio.',
      config: {
        recurso: 'campanhas',
        rotuloItem: 'campanha',
        explicacao:
          'Campanhas de divulgação rastreadas por UTM. Quando alguém chega por um link com o utm_campaign cadastrado aqui, o lead fica associado à campanha.',
        campos: [
          { chave: 'nome', rotulo: 'Nome da campanha', obrigatorio: true, placeholder: 'Ex: Lançamento Instagram' },
          { chave: 'utmSource', rotulo: 'utm_source — de onde vem', dica: 'Ex: instagram, newsletter, google' },
          { chave: 'utmMedium', rotulo: 'utm_medium — tipo de mídia', dica: 'Ex: social, email, cpc' },
          { chave: 'utmCampaign', rotulo: 'utm_campaign — identificador único', obrigatorio: true, dica: 'É o que identifica a campanha no link. Ex: lancamento-2026' },
        ],
        campoTitulo: 'nome',
        camposSubtitulo: ['utmCampaign', 'utmSource', 'utmMedium'],
        reordenavel: false,
      },
    },
  ];

  temAlteracoesNaoSalvas(): boolean {
    return !!this.listas?.some((l) => l.temAlteracoesNaoSalvas());
  }
}
