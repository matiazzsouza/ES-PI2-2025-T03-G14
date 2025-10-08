export interface TurmaDeletionRequest {
  id?: number;
  turma_id: number;
  token: string;
  user_id?: number | null;
  expires_at: string;
  created_at?: string;
}
