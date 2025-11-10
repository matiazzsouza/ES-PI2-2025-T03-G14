import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";
import { adicionarOuVincularAluno } from "../utils/add-alunos";

export async function exibirPaginaAlunos(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);
  const success = req.query.success ? String(req.query.success) : null;
  const error = req.query.error ? String(req.query.error) : null;

  try {
    const [turmaRows]: any = await pool.query(
      "SELECT id, nome, disciplina_id FROM turmas WHERE id = ?", [turmaId]
    );
    const turma = turmaRows.length ? turmaRows[0] : null;

    const [alunosRows]: any = await pool.query(
      `SELECT a.id, a.RA, a.nome
       FROM aluno_turma at
       JOIN alunos a ON at.aluno_id = a.id
       WHERE at.turma_id = ?
       ORDER BY a.nome`,
      [turmaId]
    );

    const [componentesRows]: any = await pool.query(
      "SELECT id, nome, tipo_media, peso FROM componentes WHERE turma_id = ? ORDER BY id",
      [turmaId]
    );

    const [notasRows]: any = await pool.query(`
      SELECT n.id, n.aluno_id, n.componente_id, n.nota
      FROM notas n
      WHERE n.aluno_id IN (SELECT aluno_id FROM aluno_turma WHERE turma_id = ?)
    `, [turmaId]);

    let curso = null;
    if (turma && turma.disciplina_id) {
      const [cursoRows]: any = await pool.query(
        `SELECT c.id, c.nome 
         FROM cursos c
         JOIN disciplinas d ON d.curso_id = c.id
         WHERE d.id = ?`,
        [turma.disciplina_id]
      );
      curso = cursoRows.length ? cursoRows[0] : null;
    }

    // ✅ ADD LOGS PARA DEBUG
    console.log("📋 Turma:", turma);
    console.log("👥 Alunos:", alunosRows);
    console.log("📊 Componentes:", componentesRows);
    console.log("📝 Notas:", notasRows);

    res.render("alunos/alunos", {
      title: "Grade de Alunos",
      turma: turma || {},  // ✅ Garante que não seja null
      alunos: alunosRows || [],  // ✅ Garante que seja array vazio
      componentes: componentesRows || [],
      notas: notasRows || [],
      curso: curso || {},
      user,
      success,
      error
    });
  } catch (err) {
    console.error("❌ Erro ao carregar tela de alunos:", err);
    res.status(500).render("alunos/alunos", {
      title: "Grade de Alunos",
      turma: {},
      alunos: [],
      componentes: [],
      notas: [],
      curso: {},
      user,
      success: null,
      error: "Erro ao buscar dados da turma."
    });
  }
}




export async function AdicionarAluno(req: Request, res: Response) {
  
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }
  const turmaId = Number(req.params.id);
  const { RA, nome } = req.body;
  if (!RA || !nome) {
    return res.redirect(`/turma/${turmaId}/alunos?error=Informe RA e Nome do aluno`);
  }

  try {
    const resultado = await adicionarOuVincularAluno(pool, RA, nome, turmaId);
    return res.redirect(`/turma/${turmaId}/alunos?success=${encodeURIComponent(resultado.mensagem)}`);
  } catch (err) {
    console.error("Erro ao adicionar aluno:", err);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao adicionar aluno`);
  }
}
