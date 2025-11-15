import { Pool } from "mysql2/promise";

export async function adicionarOuVincularAluno(

  pool: Pool, RA: string, nome: string, turmaId: number){

  const [existente]: any = await pool.query("SELECT id FROM alunos WHERE RA = ?", [RA]);
  
  let alunoId: number;

  let jaExistia = false;

  if (existente.length > 0) {
    
    alunoId = existente[0].id;
    jaExistia = true;

  } 

  else {
    const [result]: any = await pool.query("INSERT INTO alunos (RA, nome) VALUES (?, ?)", [RA, nome]);
    alunoId = result.insertId;
  }

  const [vinculo]: any = await pool.query(
    "SELECT * FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?", [alunoId, turmaId]
  );

  if (vinculo.length > 0) {
    return { RA, nome, status: "ignorado", mensagem: "Já cadastrado na turma" };
  }

  await pool.query(
    "INSERT INTO aluno_turma (aluno_id, turma_id) VALUES (?, ?)", [alunoId, turmaId]
  );

  return {
    RA, nome,
    status: jaExistia ? "vinculado" : "adicionado",
    mensagem: jaExistia ? "Aluno já existia, vinculado à turma" : "Aluno adicionado e vinculado"
  };

}
