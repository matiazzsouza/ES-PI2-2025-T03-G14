import { Request, Response } from 'express';
import { pool } from '../database/database-fixed';

export async function exibirDisciplinas(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const cursoId = req.params.id;

  try {
    // Buscar dados do curso
    const [cursos]: any = await pool.query(
      "SELECT id, nome FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).render("error", { 
        title: "Curso não encontrado",
        message: "Curso não encontrado ou você não tem acesso."
      });
    }

    const curso = cursos[0];

    // Buscar disciplinas do curso
    const [disciplinas]: any = await pool.query(
      `SELECT id, nome, sigla, codigo, periodo, created_at 
       FROM disciplinas 
       WHERE curso_id = ? 
       ORDER BY periodo, nome`,
      [cursoId]
    );

    res.render("disciplinas/disciplinas", {
      title: `Disciplinas - ${curso.nome}`,
      user: user,
      curso: curso,
      disciplinas: disciplinas,
      error: null, // 🔥 ADICIONAR - sempre passar a variável
      formData: null // 🔥 ADICIONAR - sempre passar a variável
    });

  } catch (error) {
    console.error("Erro ao carregar disciplinas:", error);
    res.render("error", {
      title: "Erro",
      message: "Erro ao carregar disciplinas."
    });
  }
}

export async function criarDisciplina(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const cursoId = req.params.id;
  const { nome, sigla, codigo, periodo } = req.body;

  try {
    // Verificar se o curso pertence ao usuário
    const [cursos]: any = await pool.query(
      "SELECT id FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    // Inserir disciplina
    await pool.query(
      "INSERT INTO disciplinas (nome, sigla, codigo, periodo, curso_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, sigla || null, codigo || null, periodo, cursoId, user.id]
    );

    res.redirect(`/curso/${cursoId}/disciplinas`);

  } catch (error: any) {
    console.error("Erro ao criar disciplina:", error);
    
    // Buscar curso novamente para renderizar a página
    const [cursos]: any = await pool.query(
      "SELECT id, nome FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );
    
    const [disciplinas]: any = await pool.query(
      "SELECT * FROM disciplinas WHERE curso_id = ? ORDER BY periodo, nome",
      [cursoId]
    );

    if (error.code === "ER_DUP_ENTRY") {
      return res.render("disciplinas/disciplinas", {
        title: "Disciplinas",
        user: user,
        curso: cursos[0],
        disciplinas: disciplinas,
        error: "Já existe uma disciplina com este código.",
        formData: req.body
      });
    }

    res.render("disciplinas/disciplinas", {
      title: "Disciplinas",
      user: user,
      curso: cursos[0],
      disciplinas: disciplinas,
      error: "Erro ao criar disciplina.",
      formData: req.body
    });
  }
}