import { pool } from "../database/database-fixed";

/**
 * 🔹 Serviço responsável por salvar instituições e cursos no banco de dados.
 * Tudo é feito dentro de uma transação para garantir integridade.
 */

export async function salvarInstituicoesECursos(
  userId: number,
  instituicoes: { nome: string; cursos: string[] }[]
): Promise<void> {
  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    for (const instituicao of instituicoes) {
      if (instituicao.nome.trim()) {
        // Inserir instituição
        const [instResult]: any = await connection.query(
          "INSERT INTO instituicoes (nome, user_id) VALUES (?, ?)",
          [instituicao.nome.trim(), userId]
        );

        // Inserir cursos dessa instituição
        for (const curso of instituicao.cursos) {
          if (curso.trim()) {
            await connection.query(
              "INSERT INTO cursos (nome, instituicao_id, user_id) VALUES (?, ?, ?)",
              [curso.trim(), instResult.insertId, userId]
            );
          }
        }
      }
    }

    // Atualizar flag de primeira vez
    await connection.query("UPDATE users SET primeira_vez = FALSE WHERE id = ?", [userId]);

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    console.error("Erro ao salvar instituições e cursos:", error);
    throw error;
  } finally {
    connection.release();
  }
}
