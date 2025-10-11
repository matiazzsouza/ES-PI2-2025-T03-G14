import { Request, Response } from 'express';
import { pool } from '../database/database-fixed';

export async function exibirAddDisciplina(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const cursoId = req.params.id;

  try {
    const [cursos]: any = await pool.query(
      "SELECT id, nome FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).render("disciplinas/add-disciplinas", { 
        title: "Curso não encontrado",
        user: user,
        curso: null,
        error: "Curso não encontrado ou você não tem acesso.",
        formData: null,
        success: null
      });
    }

    const curso = cursos[0];

    res.render("disciplinas/add-disciplinas", {
      title: `Adicionar Disciplina - ${curso.nome}`,
      user: user,
      curso: curso,
      error: null,
      formData: null,
      success: null
    });

  } catch (error) {
    console.error("Erro ao carregar página de adicionar disciplina:", error);
    res.status(500).render("disciplinas/add-disciplinas", {
      title: "Erro",
      user: (req.session as any).user,
      curso: null,
      error: "Erro ao carregar página.",
      formData: null,
      success: null
    });
  }
}

export async function exibirDisciplinas(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const cursoId = req.params.id;

  try {
    // Buscar curso com instituição
    const [cursos]: any = await pool.query(
      `SELECT c.id, c.nome, c.instituicao_id, i.nome as instituicao_nome
       FROM cursos c 
       JOIN instituicoes i ON c.instituicao_id = i.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(404).render("disciplinas/disciplinas", { 
        title: "Curso não encontrado",
        user: user,
        curso: null,
        instituicao: null,
        disciplinas: [],
        error: "Curso não encontrado ou você não tem acesso.",
        formData: null,
        success: null
      });
    }

    const curso = cursos[0];
    const instituicao = {
      id: curso.instituicao_id,
      nome: curso.instituicao_nome
    };

    // Buscar disciplinas com suas turmas
    const [disciplinasComTurmas]: any = await pool.query(
      `SELECT d.id, d.nome, d.sigla, d.codigo, d.periodo, d.created_at,
              t.id as turma_id, t.nome as turma_nome, t.dia_semana, t.horario, t.local
       FROM disciplinas d 
       LEFT JOIN turmas t ON d.id = t.disciplina_id
       WHERE d.curso_id = ? 
       ORDER BY d.periodo, d.nome, t.nome`,
      [cursoId]
    );

    // Processar para agrupar turmas por disciplina
    const disciplinasMap = new Map();
    
    disciplinasComTurmas.forEach((row: any) => {
      const disciplinaId = row.id;
      
      if (!disciplinasMap.has(disciplinaId)) {
        disciplinasMap.set(disciplinaId, {
          id: row.id,
          nome: row.nome,
          sigla: row.sigla,
          codigo: row.codigo,
          periodo: row.periodo,
          created_at: row.created_at,
          turmas: []
        });
      }
      
      // Se existe uma turma associada, adiciona à disciplina
      if (row.turma_id) {
        disciplinasMap.get(disciplinaId).turmas.push({
          id: row.turma_id,
          nome: row.turma_nome,
          dia_semana: row.dia_semana,
          horario: row.horario,
          local: row.local
        });
      }
    });

    const disciplinas = Array.from(disciplinasMap.values());

    res.render("disciplinas/disciplinas", {
      title: `Disciplinas - ${curso.nome}`,
      user: user,
      curso: curso,
      instituicao: instituicao,
      disciplinas: disciplinas,
      error: null,
      formData: null,
      success: req.query.success || null
    });

  } catch (error) {
    console.error("Erro ao carregar disciplinas:", error);
    res.status(500).render("disciplinas/disciplinas", {
      title: "Erro",
      user: user,
      curso: null,
      instituicao: null,
      disciplinas: [],
      error: "Erro ao carregar disciplinas.",
      formData: null,
      success: null
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
    const [cursos]: any = await pool.query(
      "SELECT id, nome FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(403).render("disciplinas/add-disciplinas", {
        title: "Acesso Negado",
        user: user,
        curso: null,
        error: "Você não tem acesso a este curso.",
        formData: req.body,
        success: null
      });
    }

    const curso = cursos[0];

    if (!nome || !periodo) {
      return res.render("disciplinas/add-disciplinas", {
        title: `Adicionar Disciplina - ${curso.nome}`,
        user: user,
        curso: curso,
        error: "Nome e período são obrigatórios.",
        formData: req.body,
        success: null
      });
    }

    await pool.query(
      "INSERT INTO disciplinas (nome, sigla, codigo, periodo, curso_id, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [nome, sigla || null, codigo || null, periodo, cursoId, user.id]
    );

    res.redirect(`/curso/${cursoId}/disciplinas?success=Disciplina criada com sucesso!`);

  } catch (error: any) {
    console.error("Erro ao criar disciplina:", error);
    
    const [cursos]: any = await pool.query(
      "SELECT id, nome FROM cursos WHERE id = ? AND user_id = ?",
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(403).render("disciplinas/add-disciplinas", {
        title: "Acesso Negado",
        user: user,
        curso: null,
        error: "Você não tem acesso a este curso.",
        formData: req.body,
        success: null
      });
    }

    const curso = cursos[0];

    if (error.code === "ER_DUP_ENTRY") {
      return res.render("disciplinas/add-disciplinas", {
        title: `Adicionar Disciplina - ${curso.nome}`,
        user: user,
        curso: curso,
        error: "Já existe uma disciplina com este código ou sigla.",
        formData: req.body,
        success: null
      });
    }

    res.render("disciplinas/add-disciplinas", {
      title: `Adicionar Disciplina - ${curso.nome}`,
      user: user,
      curso: curso,
      error: "Erro ao criar disciplina. Tente novamente.",
      formData: req.body,
      success: null
    });
  }
}

export async function editarDisciplina(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: disciplinaId } = req.params;
  const { nome, sigla, codigo, periodo } = req.body;

  try {
    const [disciplinas]: any = await pool.query(
      `SELECT d.id, d.curso_id, c.nome as curso_nome 
       FROM disciplinas d 
       JOIN cursos c ON d.curso_id = c.id 
       WHERE d.id = ? AND d.user_id = ?`,
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    await pool.query(
      "UPDATE disciplinas SET nome = ?, sigla = ?, codigo = ?, periodo = ? WHERE id = ? AND user_id = ?",
      [nome, sigla || null, codigo || null, periodo, disciplinaId, user.id]
    );

    res.json({ success: true, message: "Disciplina atualizada com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao editar disciplina:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe uma disciplina com este código ou sigla." });
    }

    res.status(500).json({ error: "Erro ao atualizar disciplina." });
  }
}

export async function excluirDisciplina(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: disciplinaId } = req.params;

  try {
    const [disciplinas]: any = await pool.query(
      "SELECT id, curso_id FROM disciplinas WHERE id = ? AND user_id = ?",
      [disciplinaId, user.id]
    );

    if (disciplinas.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const disciplina = disciplinas[0];

    const [turmas]: any = await pool.query(
      "SELECT id FROM turmas WHERE disciplina_id = ?",
      [disciplinaId]
    );

    if (turmas.length > 0) {
      return res.status(400).json({ 
        error: "Não é possível excluir disciplina com turmas associadas. Exclua as turmas primeiro." 
      });
    }

    await pool.query(
      "DELETE FROM disciplinas WHERE id = ? AND user_id = ?",
      [disciplinaId, user.id]
    );

    res.json({ 
      success: true, 
      message: "Disciplina excluída com sucesso!",
      redirect: `/curso/${disciplina.curso_id}/disciplinas?success=Disciplina excluída com sucesso!`
    });

  } catch (error) {
    console.error("Erro ao excluir disciplina:", error);
    res.status(500).json({ error: "Erro ao excluir disciplina." });
  }
}