//! arquivo usado para a inserção de novas instituições atravez do home.ejs

import { Request, Response } from 'express';
import { pool } from '../database/database-fixed';
import { salvarInstituicoesECursos } from '../services/primeiro-login-service';

// ✅ EXCLUIR INSTITUIÇÃO (com validação de cursos)
export async function excluirInstituicao(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: instituicaoId } = req.params;
  const body = req.body || {};
  const confirmacao = body.confirmacao;

  try {
    // Verificar se instituição existe e pertence ao usuário
    const [instituicoes]: any = await pool.query(
      "SELECT id, nome FROM instituicoes WHERE id = ? AND user_id = ?",
      [instituicaoId, user.id]
    );

    if (instituicoes.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const instituicao = instituicoes[0];
    const nomeInstituicao = instituicao.nome;

    // ✅ VERIFICAR SE TEM CURSOS
    const [cursos]: any = await pool.query(
      "SELECT COUNT(*) as total FROM cursos WHERE instituicao_id = ?",
      [instituicaoId]
    );

    const totalCursos = cursos[0].total;

    if (totalCursos > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Não é possível excluir instituição com cursos associados.",
        message: `A instituição "${nomeInstituicao}" possui ${totalCursos} curso(s). Exclua os cursos primeiro.`
      });
    }

    // ✅ CONFIRMAÇÃO EM 2 ETAPAS
    if (confirmacao === undefined) {
      return res.status(200).json({
        requireConfirmation: true,
        message: `Tem certeza que deseja excluir a instituição "${nomeInstituicao}"?`,
        instituicao: {
          id: instituicao.id,
          nome: nomeInstituicao
        }
      });
    }

    if (confirmacao === true) {
      await pool.query(
        "DELETE FROM instituicoes WHERE id = ? AND user_id = ?",
        [instituicaoId, user.id]
      );

      return res.json({ 
        success: true, 
        message: `Instituição "${nomeInstituicao}" excluída com sucesso!` 
      });
    }

  } catch (error) {
    console.error("Erro ao excluir instituição:", error);
    res.status(500).json({ error: "Erro ao excluir instituição." });
  }
}

// ✅ EXCLUIR CURSO (com validação de disciplinas)
export async function excluirCurso(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: cursoId } = req.params;
  const body = req.body || {};
  const confirmacao = body.confirmacao;

  try {
    // Verificar se curso existe e pertence ao usuário
    const [cursos]: any = await pool.query(
      `SELECT c.id, c.nome 
       FROM cursos c 
       JOIN instituicoes i ON c.instituicao_id = i.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    const curso = cursos[0];
    const nomeCurso = curso.nome;

    // ✅ VERIFICAR SE TEM DISCIPLINAS
    const [disciplinas]: any = await pool.query(
      "SELECT COUNT(*) as total FROM disciplinas WHERE curso_id = ?",
      [cursoId]
    );

    const totalDisciplinas = disciplinas[0].total;

    if (totalDisciplinas > 0) {
      return res.status(400).json({ 
        success: false,
        error: "Não é possível excluir curso com disciplinas associadas.",
        message: `O curso "${nomeCurso}" possui ${totalDisciplinas} disciplina(s). Exclua as disciplinas primeiro.`
      });
    }

    // ✅ CONFIRMAÇÃO EM 2 ETAPAS
    if (confirmacao === undefined) {
      return res.status(200).json({
        requireConfirmation: true,
        message: `Tem certeza que deseja excluir o curso "${nomeCurso}"?`,
        curso: {
          id: curso.id,
          nome: nomeCurso
        }
      });
    }

    if (confirmacao === true) {
      await pool.query(
        "DELETE FROM cursos WHERE id = ? AND user_id = ?",
        [cursoId, user.id]
      );

      return res.json({ 
        success: true, 
        message: `Curso "${nomeCurso}" excluído com sucesso!` 
      });
    }

  } catch (error) {
    console.error("Erro ao excluir curso:", error);
    res.status(500).json({ error: "Erro ao excluir curso." });
  }
}

// ✅ EDITAR INSTITUIÇÃO
export async function editarInstituicao(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: instituicaoId } = req.params;
  const { nome } = req.body;

  try {
    const [instituicoes]: any = await pool.query(
      "SELECT id FROM instituicoes WHERE id = ? AND user_id = ?",
      [instituicaoId, user.id]
    );

    if (instituicoes.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    await pool.query(
      "UPDATE instituicoes SET nome = ? WHERE id = ? AND user_id = ?",
      [nome, instituicaoId, user.id]
    );

    res.json({ success: true, message: "Instituição atualizada com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao editar instituição:", error);
    res.status(500).json({ error: "Erro ao atualizar instituição." });
  }
}

// ✅ EDITAR CURSO
export async function editarCurso(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: cursoId } = req.params;
  const { nome } = req.body;

  try {
    const [cursos]: any = await pool.query(
      `SELECT c.id 
       FROM cursos c 
       JOIN instituicoes i ON c.instituicao_id = i.id 
       WHERE c.id = ? AND c.user_id = ?`,
      [cursoId, user.id]
    );

    if (cursos.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    await pool.query(
      "UPDATE cursos SET nome = ? WHERE id = ? AND user_id = ?",
      [nome, cursoId, user.id]
    );

    res.json({ success: true, message: "Curso atualizado com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao editar curso:", error);
    res.status(500).json({ error: "Erro ao atualizar curso." });
  }
}

// ✅ CRIAR INSTITUIÇÃO (reutiliza serviço do primeiro login)
export async function criarInstituicao(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  const { instituicoes } = req.body;

  try {
    if (!instituicoes || !Array.isArray(instituicoes) || instituicoes.length === 0) {
      return res.render("home/nova", {
        title: "Nova Instituição",
        user: user,
        error: "É necessário informar pelo menos uma instituição.",
        formData: req.body
      });
    }

    // ✅ REUTILIZA O MESMO SERVIÇO
    await salvarInstituicoesECursos(user.id, instituicoes);

    res.redirect("/home?success=Instituição criada com sucesso!");

  } catch (error: any) {
    console.error("Erro ao criar instituição:", error);
    res.render("home/nova", {
      title: "Nova Instituição",
      user: user,
      error: "Erro ao criar instituição. Tente novamente.",
      formData: req.body
    });
  }
}

export async function exibirNovaInstituicao(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.redirect("/auth/login");
  }

  res.render("home/nova", {
    title: "Nova Instituição",
    user: user,
    error: null,
    formData: null
  });
}

export async function criarCurso(req: Request, res: Response) {
  const user = (req.session as any).user;
  
  if (!user || !user.id) {
    return res.status(401).json({ error: "Não autorizado." });
  }

  const { id: instituicaoId } = req.params;
  const { nome } = req.body;

  try {
    // Verificar se instituição pertence ao usuário
    const [instituicoes]: any = await pool.query(
      "SELECT id FROM instituicoes WHERE id = ? AND user_id = ?",
      [instituicaoId, user.id]
    );

    if (instituicoes.length === 0) {
      return res.status(403).json({ error: "Acesso negado." });
    }

    if (!nome) {
      return res.status(400).json({ error: "Nome do curso é obrigatório." });
    }

    await pool.query(
      "INSERT INTO cursos (nome, instituicao_id, user_id) VALUES (?, ?, ?)",
      [nome, instituicaoId, user.id]
    );

    res.json({ success: true, message: "Curso criado com sucesso!" });

  } catch (error: any) {
    console.error("Erro ao criar curso:", error);
    
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "Já existe um curso com este nome nesta instituição." });
    }

    res.status(500).json({ error: "Erro ao criar curso." });
  }
}