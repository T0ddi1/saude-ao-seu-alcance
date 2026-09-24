export interface LoginRequest {
  email: string;
  senha: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  nomeCompleto: string;
  email: string;
  papeis: string[];
}

export interface ArtigoAdmin {
  id: number;
  titulo: string;
  slug: string;
  resumo: string;
  conteudoHtml: string;
  imagemCapaUrl?: string | null;
  categoriaId?: number | null;
  categoriaNome?: string | null;
  categoriaSlug?: string | null;
  autorId: string;
  autorExibicao?: string | null;
  autorCargo?: string | null;
  destaque: boolean;
  visualizacoes: number;
  publicado: boolean;
  publicadoEm?: string | null;
  ativo: boolean;
  criadoEm: string;
}

export interface ArtigoSalvar {
  titulo: string;
  resumo: string;
  conteudoHtml: string;
  imagemCapaUrl?: string | null;
  categoriaId?: number | null;
  autorExibicao?: string | null;
  autorCargo?: string | null;
  destaque: boolean;
}

export interface CategoriaAdmin {
  id: number;
  nome: string;
  slug: string;
  ativo: boolean;
}

export interface EspacoPatrocinadoAdmin {
  id: number;
  tipo: string;
  chamada: string;
  titulo: string;
  descricao?: string | null;
  textoBotao?: string | null;
  link: string;
  imagemUrl?: string | null;
  logoUrl?: string | null;
  tema: string;
  tamanho: string;
  larguraPx?: number | null;
  alturaPx?: number | null;
  rotuloSite?: string | null;
  externo: boolean;
  paginaExibicao?: string | null;
  ordem: number;
  ativo: boolean;
  statusContratacao: string;
  permiteContratacaoAutonoma: boolean;
  preco?: number | null;
  dataInicioVigencia?: string | null;
  dataFimVigencia?: string | null;
  anuncianteId?: number | null;
}

export interface DadoSaudeAdmin {
  id: number;
  rotulo: string;
  valor: string;
  complemento?: string | null;
  ordem: number;
  ativo: boolean;
  indicadorIbge?: string | null;
}

export interface IndicadorIbgeOpcao {
  chave: string;
  rotulo: string;
  unidade: string;
}

export interface SeloConfiancaAdmin {
  id: number;
  icone: string;
  rotulo: string;
  ordem: number;
  ativo: boolean;
}

export interface CardConteudoAdmin {
  id: number;
  icone: string;
  titulo: string;
  imagemUrl?: string | null;
  resumo: string;
  textoLink: string;
  link: string;
  patrocinado: boolean;
  ordem: number;
  ativo: boolean;
}

export interface SlideDestaqueAdmin {
  id: number;
  chamada: string;
  titulo: string;
  resumo: string;
  textoBotao: string;
  link: string;
  imagemUrl?: string | null;
  ordem: number;
  ativo: boolean;
}

export interface ComentarioAdmin {
  id: number;
  artigoId: number;
  artigoTitulo: string;
  autorNome: string;
  texto: string;
  aprovado: boolean;
  ativo: boolean;
  comentarioPaiId?: number | null;
  criadoEm: string;
}

export interface ConfiguracaoSecaoHomeAdmin {
  id: number;
  secao: string;
  modo: string;
  limiteItens: number;
  configuracaoJson?: string | null;
}
