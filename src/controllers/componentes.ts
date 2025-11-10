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


export async function deletarComponente(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  const turmaId = Number(req.params.turmaId);
  const componenteId = Number(req.params.componenteId);

  if (!componenteId || !turmaId) {
    return res.status(400).json({ error: "IDs inválidos" });
  }

  try {
    // Remove o componente da turma
    await pool.query(
      "DELETE FROM componentes WHERE id = ? AND turma_id = ?",
      [componenteId, turmaId]
    );

    return res.status(200).json({ success: true, message: "Componente removido com sucesso!" });
  } catch (err) {
    console.error("❌ Erro ao remover componente:", err);
    return res.status(500).json({ error: "Erro ao remover componente" });
  }
}

export async function editarComponente(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  const componenteId = Number(req.params.componenteId);
  const { nome, tipo_media, peso } = req.body;

  if (!componenteId || !nome || !tipo_media) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  // Validação de peso se for ponderada
  if (tipo_media === 'ponderada' && (!peso || peso < 0 || peso > 1)) {
    return res.status(400).json({ error: "Peso inválido para média ponderada (deve ser entre 0 e 1)" });
  }

  try {
    await pool.query(
      "UPDATE componentes SET nome = ?, tipo_media = ?, peso = ? WHERE id = ?",
      [nome, tipo_media, tipo_media === 'ponderada' ? peso : null, componenteId]
    );

    return res.status(200).json({ success: true, message: "Componente atualizado!" });
  } catch (err) {
    console.error("❌ Erro ao editar componente:", err);
    return res.status(500).json({ error: "Erro ao editar componente" });
  }
}
