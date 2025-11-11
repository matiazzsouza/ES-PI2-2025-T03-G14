import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession } from "../utils/passainfos";

// Função para uso interno - calcula média de um aluno em uma turma
export async function calcularMediaAlunoInterna(alunoId: number, turmaId: number) {
  const [componentes]: any = await pool.query(
    "SELECT tipo_media FROM componentes WHERE turma_id = ? LIMIT 1",
    [turmaId]
  );
  if (componentes.length === 0) return { media: 0, tipo: null, success: false };

  const tipoMedia = componentes[0].tipo_media;
  const [notas]: any = await pool.query(
    `SELECT n.nota, c.peso 
     FROM notas n
     JOIN componentes c ON n.componente_id = c.id
     WHERE n.aluno_id = ? AND c.turma_id = ?`,
    [alunoId, turmaId]
  );
  if (notas.length === 0) return { media: 0, tipo: tipoMedia, success: true };

  let media = 0;
  if (tipoMedia === "aritmetica") {
    const soma = notas.reduce((acc: number, n: any) => acc + parseFloat(n.nota), 0);
    media = soma / notas.length;
  } else if (tipoMedia === "ponderada") {
    let somaPonderada = 0;
    let somaPesos = 0;
    notas.forEach((n: any) => {
      const nota = parseFloat(n.nota);
      const peso = (n.peso !== null && n.peso !== undefined) ? parseFloat(n.peso) : 0;
      // Só soma se ambos forem números válidos
      if (!isNaN(nota) && !isNaN(peso) && peso > 0) {
        somaPonderada += nota * peso;
        somaPesos += peso;
      }
    });
    media = somaPesos > 0 ? somaPonderada / somaPesos : 0;
  }
  
  // Proteção: garantir que a média nunca seja NaN
  if (isNaN(media)) {
    console.warn(`⚠️ Média calculada como NaN para aluno ${alunoId}. Usando 0.`);
    media = 0;
  }
  
  media = Math.round(media * 100) / 100;

  return { media, tipo: tipoMedia, success: true };
}

// Insere ou atualiza média no banco de dados
export async function salvarMediaInterna(alunoId: number, turmaId: number, media: number) {
  // Validação final: nunca salvar NaN no banco
  if (isNaN(media) || media === null || media === undefined) {
    console.warn(`⚠️ Tentativa de salvar média inválida para aluno ${alunoId}: ${media}. Usando 0.`);
    media = 0;
  }

  const [existe]: any = await pool.query(
    "SELECT id FROM medias WHERE aluno_id = ? AND turma_id = ?",
    [alunoId, turmaId]
  );
  
  if (existe.length > 0) {
    await pool.query(
      "UPDATE medias SET media = ?, data_atualizacao = NOW() WHERE aluno_id = ? AND turma_id = ?",
      [media, alunoId, turmaId]
    );
  } else {
    await pool.query(
      "INSERT INTO medias (aluno_id, turma_id, media) VALUES (?, ?, ?)",
      [alunoId, turmaId, media]
    );
  }
}

// Endpoint API GET: calcular média de 1 aluno
export async function calcularMediaAluno(req: Request, res: Response) {
  const alunoId = Number(req.params.alunoId);
  const turmaId = Number(req.params.turmaId);

  if (!alunoId || !turmaId) {
    return res.status(400).json({ error: "IDs inválidos" });
  }

  try {
    const result = await calcularMediaAlunoInterna(alunoId, turmaId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: "Erro ao calcular média" });
  }
}

// Endpoint API GET: listar todas as médias de uma turma
export async function listarMedias(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  const turmaId = Number(req.params.turmaId);
  if (!turmaId) {
    return res.status(400).json({ error: "ID da turma inválido" });
  }
  try {
    const [rows]: any = await pool.query(
      "SELECT aluno_id, media FROM medias WHERE turma_id = ?", [turmaId]
    );
    return res.json({ medias: rows, success: true });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao listar médias" });
  }
}

// Endpoint API POST: salvar uma média (manual)
export async function salvarMedia(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }
  const { alunoId, media } = req.body;
  const turmaId = Number(req.params.turmaId);

  if (!alunoId || media === undefined || !turmaId) {
    return res.status(400).json({ error: "Dados inválidos" });
  }
  try {
    await salvarMediaInterna(Number(alunoId), Number(turmaId), Number(media));
    return res.json({ success: true, message: "Média salva com sucesso" });
  } catch (err) {
    return res.status(500).json({ error: "Erro ao salvar média" });
  }
}