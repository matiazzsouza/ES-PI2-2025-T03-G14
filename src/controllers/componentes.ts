import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";

// Controller POST: adicionar vários componentes na turma
export async function adicionarComponentes(req: Request, res: Response) {

  
  if (!validateUserSession(req.session)) return res.redirect("/auth/login");
  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  // Espera receber:
  // tipo_media: 'aritmetica' ou 'ponderada'
  // componentes: [{ nome: "...", peso: ... }, ...]
  const { tipo_media, componentes } = req.body;

  if (!tipo_media || !Array.isArray(componentes) || componentes.length === 0) {
    return res.redirect(`/turma/${turmaId}/alunos?error=Preencha todos os campos do componente`);
  }

  try {
    let inseridos = 0, ignorados = 0;

    for (const c of componentes) {
      // Se ponderada, o peso é obrigatório
      if (tipo_media === 'ponderada' && (!c.peso || isNaN(c.peso))) {
        ignorados++;
        continue;
      }

      // Insere componente
      await pool.query(
        "INSERT INTO componentes (turma_id, nome, tipo_media, peso) VALUES (?, ?, ?, ?)",
        [
          turmaId,
          c.nome,
          tipo_media,
          tipo_media === 'ponderada' ? c.peso : null
        ]
      );
      inseridos++;
    }

    return res.redirect(`/turma/${turmaId}/alunos?success=Componentes adicionados: ${inseridos}, ignorados: ${ignorados}`);
  } catch (err) {
    console.error('Erro ao adicionar componentes:', err);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao adicionar componentes`);
  }
}
