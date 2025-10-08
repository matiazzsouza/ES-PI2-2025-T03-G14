export interface Disciplina {
  id?: number;
  nome: string;
  sigla?: string;
  codigo?: string;
  periodo?: number;
  instituicao_id?: number | null;
}
