import { Request, Response } from 'express';
import { pool } from '../database/database-fixed';

export async function exibirAddTurmas(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const disciplinaId = req.params.id;

  try {
    // Buscar disciplina com curso
    const [disciplinas]: any = await pool.query(
      `SELECT d.*, c.id as curso_id, c.nome as curso_nome 
       FROM disciplinas d 
       JOIN cursos c ON d.curso_id = c.id 
       WHERE d.id = ? AND d.user_id = ?`,
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(404).render("error", { 
        title: "Disciplina não encontrada",
        user: user,
        error: "Disciplina não encontrada ou você não tem acesso."
      });
    }

    const disciplina = disciplinas[0];
    const curso = {
      id: disciplina.curso_id,
      nome: disciplina.curso_nome
    };

    res.render("turmas/add-turmas", {
      title: `Adicionar Turmas - ${disciplina.nome}`,
      user: user,
      disciplina: disciplina,
      curso: curso,
      error: null
    });

  } catch (error) {
    console.error("Erro ao carregar página de turmas:", error);
    res.status(500).render("error", {
      title: "Erro",
      user: user,
      error: "Erro ao carregar página."
    });
  }
}

export async function criarMultiplasTurmas(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const disciplinaId = req.params.id;
  const { turmas } = req.body;

  try {
    // Verificar acesso à disciplina
    const [disciplinas]: any = await pool.query(
      "SELECT curso_id FROM disciplinas WHERE id = ? AND user_id = ?",
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(403).redirect(`/disciplina/${disciplinaId}/turmas/add?error=Acesso negado`);
    }

    const disciplina = disciplinas[0];

    if (!turmas || !Array.isArray(turmas) || turmas.length === 0) {
      return res.redirect(`/disciplina/${disciplinaId}/turmas/add?error=Nenhuma turma fornecida`);
    }

    // Inserir múltiplas turmas
    for (let i = 0; i < turmas.length; i++) {
      const turma = turmas[i];
      if (turma.nome && turma.nome.trim()) {
        await pool.query(
          "INSERT INTO turmas (nome, dia_semana, horario, local, disciplina_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
          [
            turma.nome.trim(),
            turma.dia_semana || null,
            turma.horario || null,
            turma.local || null,
            disciplinaId,
            user.id
          ]
        );
      }
    }

    res.redirect(`/curso/${disciplina.curso_id}/disciplinas?success=Turmas adicionadas com sucesso!`);

  } catch (error: any) {
    console.error("Erro ao criar turmas:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.redirect(`/disciplina/${disciplinaId}/turmas/add?error=Já existe uma turma com este nome`);
    }

    res.redirect(`/disciplina/${disciplinaId}/turmas/add?error=Erro ao salvar turmas`);
  }
}