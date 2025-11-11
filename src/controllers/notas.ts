import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { calcularMediaAlunoInterna, salvarMediaInterna } from "./medias";

// Buscar todas as notas da turma
export async function buscarNotasTurma(req: Request, res: Response) {
  const { turmaId } = req.params;
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
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
    const [existente]: any = await pool.query(
      "SELECT id FROM notas WHERE aluno_id = ? AND componente_id = ?",
      [alunoId, componente_id]
    );

    if (existente.length > 0) {
      await pool.query(
        "UPDATE notas SET nota = ? WHERE aluno_id = ? AND componente_id = ?",
        [nota, alunoId, componente_id]
      );
    } else {
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
  const turmaId = Number(req.params.turmaId);
  const { notas } = req.body;
  const user = (req.session as any).user;

  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado" });
  }

  try {
    for (const notaItem of notas) {
      const { aluno_id, componente_id, nota } = notaItem;

      const [existente]: any = await pool.query(
        "SELECT id FROM notas WHERE aluno_id = ? AND componente_id = ?",
        [aluno_id, componente_id]
      );

      if (existente.length > 0) {
        await pool.query(
          "UPDATE notas SET nota = ? WHERE aluno_id = ? AND componente_id = ?",
          [nota, aluno_id, componente_id]
        );
      } else {
        await pool.query(
          "INSERT INTO notas (aluno_id, componente_id, nota) VALUES (?, ?, ?)",
          [aluno_id, componente_id, nota]
        );
      }
    }

    // Gera array de IDs únicos e garantindo tipagem number
    const alunosIds: number[] = Array.from(
      new Set(
        (notas as { aluno_id: number }[]).map(n => Number(n.aluno_id))
      )
    ).filter(id => typeof id === "number" && !isNaN(id) && id > 0);

    // Atualiza médias dos alunos alterados
    for (const alunoId of alunosIds) {
      const id = Number(alunoId);
      const result = await calcularMediaAlunoInterna(id, turmaId);
      
      // Proteção: só salva se a média for um número válido
      if (result.success && !isNaN(result.media) && result.media !== null && result.media !== undefined) {
        await salvarMediaInterna(id, turmaId, result.media);
      } else {
        console.warn(`⚠️ Média inválida para aluno ${id}: ${result.media}`);
      }
    }

    return res.json({ success: true, message: "Notas e médias salvas com sucesso" });
  } catch (error) {
    console.error("Erro ao salvar notas em lote:", error);
    return res.status(500).json({ error: "Erro ao salvar notas" });
  }
}