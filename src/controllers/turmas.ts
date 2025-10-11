import { Request, Response } from 'express';
import { pool } from '../database/database-fixed';

export async function listarTurmasPorDisciplina(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: disciplinaId } = req.params;

  try {
    const [disciplinas]: any = await pool.query(
      "SELECT id FROM disciplinas WHERE id = ? AND user_id = ?",
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const [turmas]: any = await pool.query(
      `SELECT id, nome, dia_semana, horario, local, created_at, updated_at
       FROM turmas 
       WHERE disciplina_id = ? 
       ORDER BY nome`,
      [disciplinaId]
    );

    res.json({ success: true, turmas: turmas });

  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    res.status(500).json({ error: "Erro ao buscar turmas." });
  }
}

export async function criarTurma(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: disciplinaId } = req.params;
  const { nome, dia_semana, horario, local } = req.body;

  try {
    const [disciplinas]: any = await pool.query(
      "SELECT id, curso_id FROM disciplinas WHERE id = ? AND user_id = ?",
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    if (!nome) {
      return res.status(400).json({ error: "Nome da turma é obrigatório." });
    }

    await pool.query(
      "INSERT INTO turmas (nome, dia_semana, horario, local, disciplina_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, dia_semana || null, horario || null, local || null, disciplinaId, user.id]
    );

    res.json({ success: true, message: "Turma criada com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao criar turma:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe uma turma com este nome nesta disciplina." });
    }

    res.status(500).json({ error: "Erro ao criar turma." });
  }
}

export async function obterTurma(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: turmaId } = req.params;

  try {
    const [turmas]: any = await pool.query(
      `SELECT t.id, t.nome, t.dia_semana, t.horario, t.local, t.disciplina_id
       FROM turmas t 
       JOIN disciplinas d ON t.disciplina_id = d.id 
       WHERE t.id = ? AND t.user_id = ?`,
      [turmaId, user.id]
    );

    if (turmas.length === 0) {
      return res.status(404).json({ error: "Turma não encontrada." });
    }

    res.json({ success: true, turma: turmas[0] });

  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    res.status(500).json({ error: "Erro ao buscar turma." });
  }
}

export async function editarTurma(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: turmaId } = req.params;
  const { nome, dia_semana, horario, local } = req.body;

  try {
    const [turmas]: any = await pool.query(
      `SELECT t.id 
       FROM turmas t 
       JOIN disciplinas d ON t.disciplina_id = d.id 
       WHERE t.id = ? AND t.user_id = ?`,
      [turmaId, user.id]
    );

    if (turmas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    if (!nome) {
      return res.status(400).json({ error: "Nome da turma é obrigatório." });
    }

    await pool.query(
      "UPDATE turmas SET nome = ?, dia_semana = ?, horario = ?, local = ? WHERE id = ? AND user_id = ?",
      [nome, dia_semana || null, horario || null, local || null, turmaId, user.id]
    );

    res.json({ success: true, message: "Turma atualizada com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao editar turma:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe uma turma com este nome." });
    }

    res.status(500).json({ error: "Erro ao atualizar turma." });
  }
}

export async function excluirTurma(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: turmaId } = req.params;

  try {
    const [turmas]: any = await pool.query(
      "SELECT id FROM turmas WHERE id = ? AND user_id = ?",
      [turmaId, user.id]
    );

    if (turmas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    await pool.query(
      "DELETE FROM turmas WHERE id = ? AND user_id = ?",
      [turmaId, user.id]
    );

    res.json({ success: true, message: "Turma excluída com sucesso!" });

  } catch (error) {
    console.error("Erro ao excluir turma:", error);
    res.status(500).json({ error: "Erro ao excluir turma." });
  }
}