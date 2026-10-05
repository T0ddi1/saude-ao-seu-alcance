export type CampoTipo = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image' | 'richtext' | 'arquivo' | 'link' | 'icone' | 'indicador-ibge';

export interface CampoFormulario {
  chave: string;
  rotulo: string;
  tipo: CampoTipo;
  obrigatorio?: boolean;
  opcoes?: string[];
  rotulosOpcoes?: Record<string, string>;
}

export const ROTULOS_TIPO_ESPACO: Record<string, string> = {
  Anuncio: 'Anúncio',
  ConteudoDeMarca: 'Conteúdo de marca',
  Patrocinio: 'Patrocínio',
};

export interface RecursoAdminConfig {
  path: string;
  titulo: string;
  campos: CampoFormulario[];
  colunasTabela: string[];

  secaoHome?: string;
  escondeListaAbaixo?: boolean;
}

export const RECURSOS_ADMIN: Record<string, RecursoAdminConfig> = {
  'palavras-bloqueadas': {
    path: 'palavras-bloqueadas',
    titulo: 'Palavras Bloqueadas (moderação de comentários)',
    campos: [
      { chave: 'texto', rotulo: 'Palavra ou termo', tipo: 'text', obrigatorio: true },
    ],
    colunasTabela: ['texto', 'ativo'],
  },
  especialidades: {
    path: 'especialidades',
    titulo: 'Especialidades médicas',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem na lista', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['nome', 'ordem', 'ativo'],
  },
  'origens-lead': {
    path: 'origens-lead',
    titulo: 'Origens do lead ("De onde você veio?")',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem na lista', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['nome', 'ordem', 'ativo'],
  },
  'tipos-interesse': {
    path: 'tipos-interesse',
    titulo: 'Tipos de interesse',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem na lista', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['nome', 'ordem', 'ativo'],
  },
  campanhas: {
    path: 'campanhas',
    titulo: 'Campanhas (UTM)',
    campos: [
      { chave: 'nome', rotulo: 'Nome da campanha', tipo: 'text', obrigatorio: true },
      { chave: 'utmSource', rotulo: 'utm_source (de onde vem. Ex: instagram)', tipo: 'text' },
      { chave: 'utmMedium', rotulo: 'utm_medium (tipo de mídia. Ex: social, email, cpc)', tipo: 'text' },
      { chave: 'utmCampaign', rotulo: 'utm_campaign (identificador único da campanha)', tipo: 'text', obrigatorio: true },
    ],
    colunasTabela: ['nome', 'utmSource', 'utmMedium', 'utmCampaign', 'ativo'],
  },
  categorias: {
    path: 'categorias',
    titulo: 'Categorias',
    campos: [
      { chave: 'nome', rotulo: 'Nome', tipo: 'text', obrigatorio: true },
      { chave: 'resumo', rotulo: 'Resumo (opcional)', tipo: 'textarea' },
      { chave: 'icone', rotulo: 'Ícone (opcional)', tipo: 'icone' },
      { chave: 'ehSecaoObservatorio', rotulo: 'É seção do Observatório?', tipo: 'checkbox' },
    ],
    colunasTabela: ['nome', 'slug', 'ehSecaoObservatorio', 'ativo'],
  },
  'espacos-patrocinados': {
    path: 'espacos-patrocinados',
    titulo: 'Espaços Patrocinados',
    secaoHome: 'Patrocinio',
    escondeListaAbaixo: true,
    campos: [
      { chave: 'tipo', rotulo: 'Tipo', tipo: 'select', obrigatorio: true, opcoes: ['Anuncio', 'ConteudoDeMarca', 'Patrocinio'], rotulosOpcoes: ROTULOS_TIPO_ESPACO },
      { chave: 'chamada', rotulo: 'Chamada (eyebrow)', tipo: 'text', obrigatorio: true },
      { chave: 'titulo', rotulo: 'Título', tipo: 'text', obrigatorio: true },
      { chave: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      { chave: 'textoBotao', rotulo: 'Texto do botão', tipo: 'text' },
      { chave: 'link', rotulo: 'Link de redirecionamento', tipo: 'link', obrigatorio: true },
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image' },
      { chave: 'logoUrl', rotulo: 'Logo', tipo: 'image' },
      { chave: 'tema', rotulo: 'Tema', tipo: 'select', obrigatorio: true, opcoes: ['Light', 'Dark', 'Brand', 'Banner'] },
      { chave: 'tamanho', rotulo: 'Tamanho', tipo: 'select', obrigatorio: true, opcoes: ['Sm', 'Md', 'Lg', 'Xl'] },
      { chave: 'larguraPx', rotulo: 'Largura (px)', tipo: 'number' },
      { chave: 'alturaPx', rotulo: 'Altura (px)', tipo: 'number' },
      { chave: 'rotuloSite', rotulo: 'Rótulo do site (siteLabel)', tipo: 'text' },
      { chave: 'externo', rotulo: 'Link externo', tipo: 'checkbox' },
      { chave: 'paginaExibicao', rotulo: 'Página de exibição (vazio = home)', tipo: 'text' },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['titulo', 'tipo', 'tamanho', 'ordem', 'ativo'],
  },
  'dados-saude': {
    path: 'dados-saude',
    titulo: 'Dados da Saúde',
    secaoHome: 'DadosSaude',
    escondeListaAbaixo: true,
    campos: [
      { chave: 'indicadorIbge', rotulo: 'Fonte do dado', tipo: 'indicador-ibge' },
      { chave: 'rotulo', rotulo: 'Rótulo', tipo: 'text', obrigatorio: true },
      { chave: 'valor', rotulo: 'Valor (preenchido sozinho se escolher uma fonte do IBGE acima)', tipo: 'text', obrigatorio: true },
      { chave: 'complemento', rotulo: 'Complemento (preenchido sozinho se escolher uma fonte do IBGE acima)', tipo: 'text' },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['rotulo', 'valor', 'ordem', 'ativo'],
  },
  'selos-confianca': {
    path: 'selos-confianca',
    titulo: 'Selos de Confiança',
    secaoHome: 'SelosConfianca',
    escondeListaAbaixo: true,
    campos: [
      { chave: 'icone', rotulo: 'Ícone', tipo: 'icone', obrigatorio: true },
      { chave: 'rotulo', rotulo: 'Rótulo', tipo: 'text', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['icone', 'rotulo', 'ordem', 'ativo'],
  },
  'cards-conteudo': {
    path: 'cards-conteudo',
    titulo: 'Cards de Conteúdo (grade da home)',
    secaoHome: 'GradeConteudo',
    campos: [
      { chave: 'icone', rotulo: 'Ícone', tipo: 'icone', obrigatorio: true },
      { chave: 'titulo', rotulo: 'Título', tipo: 'text', obrigatorio: true },
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image' },
      { chave: 'resumo', rotulo: 'Resumo', tipo: 'textarea', obrigatorio: true },
      { chave: 'textoLink', rotulo: 'Texto do link', tipo: 'text', obrigatorio: true },
      { chave: 'link', rotulo: 'Link', tipo: 'link', obrigatorio: true },
      { chave: 'patrocinado', rotulo: 'Conteúdo de marca', tipo: 'checkbox' },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['titulo', 'ordem', 'patrocinado', 'ativo'],
  },
  'slides-destaque': {
    path: 'slides-destaque',
    titulo: 'Slides do Carrossel (modo manual)',
    secaoHome: 'CarrosselDestaque',
    campos: [
      { chave: 'chamada', rotulo: 'Chamada (eyebrow)', tipo: 'text', obrigatorio: true },
      { chave: 'titulo', rotulo: 'Título', tipo: 'text', obrigatorio: true },
      { chave: 'resumo', rotulo: 'Resumo', tipo: 'textarea', obrigatorio: true },
      { chave: 'textoBotao', rotulo: 'Texto do botão', tipo: 'text', obrigatorio: true },
      { chave: 'link', rotulo: 'Link', tipo: 'link', obrigatorio: true },
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image' },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['titulo', 'ordem', 'ativo'],
  },
  'menu-itens': {
    path: 'menu-itens',
    titulo: 'Menu — Itens (dropdown do topo)',
    campos: [
      { chave: 'label', rotulo: 'Label', tipo: 'text', obrigatorio: true },
      { chave: 'href', rotulo: 'Link (use # se só abre dropdown)', tipo: 'link', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['label', 'href', 'ordem', 'ativo'],
  },
  'menu-links': {
    path: 'menu-links',
    titulo: 'Menu — Links dentro do dropdown',
    campos: [
      { chave: 'menuItemId', rotulo: 'ID do item de menu (pai)', tipo: 'number', obrigatorio: true },
      { chave: 'colunaTitulo', rotulo: 'Título da coluna', tipo: 'text' },
      { chave: 'label', rotulo: 'Label', tipo: 'text', obrigatorio: true },
      { chave: 'href', rotulo: 'Link', tipo: 'link', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['menuItemLabel', 'colunaTitulo', 'label', 'ordem', 'ativo'],
  },
  'footer-links': {
    path: 'footer-links',
    titulo: 'Rodapé — Links por coluna',
    campos: [
      { chave: 'coluna', rotulo: 'Coluna (ex: Observatório, Conteúdos, Institucional)', tipo: 'text', obrigatorio: true },
      { chave: 'label', rotulo: 'Label', tipo: 'text', obrigatorio: true },
      { chave: 'href', rotulo: 'Link', tipo: 'link', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['coluna', 'label', 'ordem', 'ativo'],
  },
  'footer-redes-sociais': {
    path: 'footer-redes-sociais',
    titulo: 'Rodapé — Redes Sociais',
    campos: [
      { chave: 'icone', rotulo: 'Ícone', tipo: 'icone', obrigatorio: true },
      { chave: 'label', rotulo: 'Label', tipo: 'text', obrigatorio: true },
      { chave: 'href', rotulo: 'Link', tipo: 'text', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['icone', 'label', 'ordem', 'ativo'],
  },
  'footer-projetos-especiais': {
    path: 'footer-projetos-especiais',
    titulo: 'Rodapé — Projetos Especiais',
    campos: [
      { chave: 'icone', rotulo: 'Ícone', tipo: 'icone', obrigatorio: true },
      { chave: 'titulo', rotulo: 'Título', tipo: 'text', obrigatorio: true },
      { chave: 'descricao', rotulo: 'Descrição', tipo: 'textarea' },
      { chave: 'href', rotulo: 'Link', tipo: 'link', obrigatorio: true },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['titulo', 'ordem', 'ativo'],
  },
  'paginas-institucionais': {
    path: 'paginas-institucionais',
    titulo: 'Páginas Institucionais',
    campos: [
      { chave: 'titulo', rotulo: 'Título', tipo: 'text', obrigatorio: true },
      { chave: 'resumoBusca', rotulo: 'Resumo (aparece na busca)', tipo: 'textarea' },
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image' },
      { chave: 'conteudoHtml', rotulo: 'Conteúdo', tipo: 'richtext', obrigatorio: true },
      { chave: 'anexoUrl', rotulo: 'Anexo (PDF) — ex: política de privacidade', tipo: 'arquivo' },
      { chave: 'anexoLabel', rotulo: 'Legenda do anexo (ex: PDF · atualizado em 20/08/2026)', tipo: 'text' },
    ],
    colunasTabela: ['titulo', 'slug', 'ativo'],
  },
};
