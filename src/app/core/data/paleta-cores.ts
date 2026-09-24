export interface TokenCor {
  chave: string;
  rotulo: string;
  padrao: string;
  usadoEm: string;
}

export interface GrupoCores {
  titulo: string;
  tokens: TokenCor[];
}

export const GRUPOS_PALETA: GrupoCores[] = [
  {
    titulo: 'Cores principais',
    tokens: [
      { chave: 'color-primary', rotulo: 'Primária', padrao: '#5c26e4', usadoEm: 'Cabeçalho, faixa do rodapé, botões principais, links, ícones de destaque' },
      { chave: 'color-primary-dark', rotulo: 'Primária (escura)', padrao: '#4318ab', usadoEm: 'Hover de botões e links primários, painel "Institucional" do rodapé' },
      { chave: 'color-primary-tint', rotulo: 'Primária (clara)', padrao: '#f8f5ff', usadoEm: 'Fundos suaves de destaque em cards e seções' },
      { chave: 'color-secondary', rotulo: 'Secundária', padrao: '#d7b9eb', usadoEm: 'Detalhes decorativos e hover sobre fundo roxo (menu, rodapé)' },
      { chave: 'color-info', rotulo: 'Informação', padrao: '#004aad', usadoEm: 'Reservada para destaques informativos' },
    ],
  },
  {
    titulo: 'Cores de texto',
    tokens: [
      { chave: 'color-ink', rotulo: 'Título', padrao: '#1e1e1e', usadoEm: 'Títulos e textos de maior destaque (h1 a h6)' },
      { chave: 'color-body-text', rotulo: 'Texto', padrao: '#494949', usadoEm: 'Texto de parágrafo padrão' },
      { chave: 'color-muted', rotulo: 'Texto suave', padrao: '#6b6b6b', usadoEm: 'Legendas, datas e textos secundários' },
    ],
  },
  {
    titulo: 'Fundos e bordas',
    tokens: [
      { chave: 'color-border', rotulo: 'Borda', padrao: '#d9d9d9', usadoEm: 'Bordas finas de cards e campos de formulário' },
      { chave: 'color-border-strong', rotulo: 'Borda em destaque', padrao: '#c8c8c8', usadoEm: 'Campos em foco e elementos de destaque' },
      { chave: 'color-surface', rotulo: 'Superfície', padrao: '#ffffff', usadoEm: 'Fundo padrão das páginas e cards' },
      { chave: 'color-surface-alt', rotulo: 'Superfície alternativa', padrao: '#f7f7f8', usadoEm: 'Fundo de campos e seções levemente destacadas' },
    ],
  },
];

export const TODOS_TOKENS_PALETA: TokenCor[] = GRUPOS_PALETA.flatMap((g) => g.tokens);
