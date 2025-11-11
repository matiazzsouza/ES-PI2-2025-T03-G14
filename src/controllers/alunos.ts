import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";
import { adicionarOuVincularAluno } from "../utils/add-alunos";

// Exibir página de alunos
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

    // Busca as médias salvas da turma
    const [mediasRows]: any = await pool.query(
      "SELECT aluno_id, media FROM medias WHERE turma_id = ?", [turmaId]
    );
    const mediasMap: { [key: number]: number } = {};
    mediasRows.forEach((m: any) => { mediasMap[m.aluno_id] = m.media; });

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

    res.render("alunos/alunos", {
      title: "Grade de Alunos",
      turma: turma || {},
      alunos: alunosRows || [],
      componentes: componentesRows || [],
      notas: notasRows || [],
      mediasMap: mediasMap,
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
      mediasMap: {},
      curso: {},
      user,
      success: null,
      error: "Erro ao buscar dados da turma."
    });
  }
}

// Adicionar novo aluno
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

// Deletar aluno
export async function deletaAluno(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  const turmaId = Number(req.params.turmaId);
  const alunoId = Number(req.params.alunoId);

  console.log('DELETE ALUNO - turmaId:', turmaId, 'alunoId:', alunoId);

  if (!alunoId || !turmaId || isNaN(alunoId) || isNaN(turmaId)) {
    return res.status(400).json({ error: "IDs inválidos", success: false });
  }

  try {
    // Remove o vínculo do aluno com a turma
    await pool.query(
      "DELETE FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?",
      [alunoId, turmaId]
    );

    return res.status(200).json({ success: true, message: "Aluno removido com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao remover aluno:", err);
    return res.status(500).json({ error: "Erro ao remover aluno", success: false });
  }
}

// Editar aluno
export async function editarAluno(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  const alunoId = Number(req.params.alunoId);
  const { nome, RA } = req.body;

  if (!alunoId || !nome || !RA) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    await pool.query(
      "UPDATE alunos SET nome = ?, RA = ? WHERE id = ?",
      [nome, RA, alunoId]
    );

    return res.status(200).json({ success: true, message: "Aluno atualizado!" });
  } catch (err) {
    console.error("❌ Erro ao editar aluno:", err);
    return res.status(500).json({ error: "Erro ao editar aluno" });
  }
}