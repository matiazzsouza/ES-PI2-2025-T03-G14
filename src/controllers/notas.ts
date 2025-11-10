import { Request, Response } from "express";
import { pool } from "../database/database-fixed";

// Buscar todas as notas da turma
export async function buscarNotasTurma(req: Request, res: Response) {
  const { turmaId } = req.params;
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    // Busca notas de todos os alunos da turma
    const [notas]: any = await pool.query(`
      SELECT n.id, n.aluno_id, n.componente_id, n.nota
      FROM notas n
      INNER JOIN alunos a ON n.aluno_id = a.id
      WHERE a.turma_id = ?
    `, [turmaId]);

    res.json({ notas });
  } catch (error) {
    console.error("Erro ao buscar notas:", error);
    res.status(500).json({ error: "Erro ao buscar notas" });
  }
}

// Salvar/Atualizar nota individual
export async function salvarNotaIndividual(req: Request, res: Response) {
  const { turmaId, alunoId } = req.params;
  const { componente_id, nota } = req.body;
  const user = (req.session as any).user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    // Verifica se nota já existe
    const [existente]: any = await pool.query(
      "SELECT id FROM notas WHERE aluno_id = ? AND componente_id = ?",
      [alunoId, componente_id]
    );

    if (existente.length > 0) {
      // UPDATE
      await pool.query(
        "UPDATE notas SET nota = ? WHERE aluno_id = ? AND componente_id = ?",
        [nota, alunoId, componente_id]
      );
    } else {
      // INSERT
      await pool.query(
        "INSERT INTO notas (aluno_id, componente_id, nota) VALUES (?, ?, ?)",
        [alunoId, componente_id, nota]
      );
    }

    res.json({ success: true, message: "Nota salva com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar nota:", error);
    res.status(500).json({ error: "Erro ao salvar nota" });
  }
}

// Salvar notas em lote (modo edição em massa)
export async function salvarNotasLote(req: Request, res: Response) {
  const { turmaId } = req.params;
  const { notas } = req.body; // Array de { aluno_id, componente_id, nota }
  const user = (req.session as any).user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    for (const notaItem of notas) {
      const { aluno_id, componente_id, nota } = notaItem;

      // Verifica se existe
      const [existente]: any = await pool.query(
        "SELECT id FROM notas WHERE aluno_id = ? AND componente_id = ?",
        [aluno_id, componente_id]
      );

      if (existente.length > 0) {
        // UPDATE
        await pool.query(
          "UPDATE notas SET nota = ? WHERE aluno_id = ? AND componente_id = ?",
          [nota, aluno_id, componente_id]
        );
      } else {
        // INSERT
        await pool.query(
          "INSERT INTO notas (aluno_id, componente_id, nota) VALUES (?, ?, ?)",
          [aluno_id, componente_id, nota]
        );
      }
    }

    res.json({ success: true, message: "Notas salvas com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar notas em lote:", error);
    res.status(500).json({ error: "Erro ao salvar notas" });
  }
}
