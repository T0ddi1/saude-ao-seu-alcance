export type CampoTipo = 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'image' | 'richtext' | 'arquivo' | 'link' | 'icone' | 'indicador-ibge';

export interface CampoFormulario {
  chave: string;
  rotulo: string;
  tipo: CampoTipo;
  obrigatorio?: boolean;
  opcoes?: string[];
  rotulosOpcoes?: Record<string, string>;
  /** Onde a imagem aparece e qual o tamanho/proporção ideal (mostrado abaixo do botão de enviar). */
  dicaImagem?: string;
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
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image', dicaImagem: 'Banner: aparece inteiro, na largura do espaço (altura de 267 px). Card: aparece cortada ao centro. Ideal: 800 × 534 px.' },
      { chave: 'logoUrl', rotulo: 'Logo', tipo: 'image', dicaImagem: 'PNG com fundo transparente, bem horizontal (ex.: 400 × 100 px). Aparece com 26 px de altura.' },
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
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image', dicaImagem: 'Aparece no card da grade da Home em proporção 4:3, cortada ao centro. Ideal: 1200 × 900 px.' },
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
      { chave: 'imagemUrl', rotulo: 'Imagem', tipo: 'image', dicaImagem: 'Aparece no destaque da Home em proporção 5:4 (celular: 16:10), cortada ao centro. Ideal: 1500 × 1200 px.' },
      { chave: 'ordem', rotulo: 'Ordem', tipo: 'number', obrigatorio: true },
    ],
    colunasTabela: ['titulo', 'ordem', 'ativo'],
  },
};
