import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";



export async function exibirPaginaAlunos(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  // Mensagens de feedback
  const success = req.query.success ? String(req.query.success) : null;
  const error = req.query.error ? String(req.query.error) : null;

  try {
    const [turmaRows]: any = await pool.query(
      "SELECT id, nome FROM turmas WHERE id = ?", [turmaId]
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

    const componentesRows: any[] = [];

    res.render("alunos/alunos", {
      title: "Grade de Alunos",
      turma,
      alunos: alunosRows,
      componentes: componentesRows,
      user,
      success,
      error
    });
  } catch (err) {
    console.error("Erro ao carregar tela de alunos:", err);
    res.status(500).render("alunos/alunos", {
      title: "Grade de Alunos",
      turma: null,
      alunos: [],
      componentes: [],
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

  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  const { RA, nome } = req.body;
  if (!RA || !nome) {
    return res.redirect(`/turma/${turmaId}/alunos?error=Informe RA e Nome do aluno`);
  }

  try {
    // Verifica se já existe aluno com esse RA
    const [existente]: any = await pool.query(
      "SELECT id FROM alunos WHERE RA = ?", [RA]
    );

    let alunoId: number;
    let jaExistia = false;
    if (existente.length > 0) {
      alunoId = existente[0].id;
      jaExistia = true;
    } else {
      // Cadastra novo aluno
      const [result]: any = await pool.query(
        "INSERT INTO alunos (RA, nome) VALUES (?, ?)", [RA, nome]
      );
      alunoId = result.insertId;
    }

    // Vincula aluno à turma
   // Verifica se já está vinculado à turma
const [vinculo]: any = await pool.query(
  "SELECT * FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?", [alunoId, turmaId]
);
if (vinculo.length > 0) {
  return res.redirect(`/turma/${turmaId}/alunos?error=Aluno já está cadastrado nesta turma`);
}
// Se não, vincula normalmente
await pool.query(
  "INSERT INTO aluno_turma (aluno_id, turma_id) VALUES (?, ?)", [alunoId, turmaId]
);
const msg = jaExistia ? "Aluno já existia, vinculado à turma" : "Aluno adicionado com sucesso";
return res.redirect(`/turma/${turmaId}/alunos?success=${encodeURIComponent(msg)}`);

  } catch (err) {
    console.error("Erro ao adicionar aluno:", err);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao adicionar aluno`);
  }
}
