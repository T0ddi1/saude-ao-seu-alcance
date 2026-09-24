export interface Perfil {
  email: string;
  nomeCompleto: string;
  nomeSocial?: string | null;
  fotoUrl?: string | null;
  celular?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}

export interface PerfilAtualizar {
  nomeCompleto: string;
  nomeSocial?: string | null;
  fotoUrl?: string | null;
  celular?: string | null;
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
}
