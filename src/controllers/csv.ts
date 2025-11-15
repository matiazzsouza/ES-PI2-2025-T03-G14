import  { Request, Response, NextFunction } from "express";
  import path from "path";
  // @ts-ignore
  import { parseAsync } from "json2csv";
import fs from "fs";
import csvParser from "csv-parser";
import { pool } from "../database/database-fixed";
import { adicionarOuVincularAluno } from "../utils/add-alunos";

// Middleware para capturar erros do Multer
export function multerErrorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.redirect(`/turma/${req.params.id}/alunos?error=Tamanho máximo do arquivo excedido!`);
    }
    if (err.message) {
      return res.redirect(`/turma/${req.params.id}/alunos?error=${encodeURIComponent(err.message)}`);
    }
    return res.redirect(`/turma/${req.params.id}/alunos?error=Erro no upload do CSV.`);
  }
  next();
}

export async function importarAlunosCSV(req: Request, res: Response) {
  if (!req.file || !req.file.path) {
    return res.redirect(`/turma/${req.params.id}/alunos?error=Arquivo CSV não enviado ou não processado.`);
  }
  const turmaId = Number(req.params.id);
  const alunosImportados: { RA: string; nome: string }[] = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row: any) => {
      const valores = Object.values(row);
      if (valores.length >= 2) {
        const RA = String(valores[0]).trim();
        const nome = String(valores[1]).trim();
        if (RA && nome) alunosImportados.push({ RA, nome });
      }
    })
    .on("end", async () => {
      const resultados: any[] = [];
      for (const aluno of alunosImportados) {
        const resultado = await adicionarOuVincularAluno(pool, aluno.RA, aluno.nome, turmaId);
        resultados.push(resultado);
      }
      // Apaga o arquivo temporário de modo seguro
      try { fs.unlinkSync(req.file!.path); } catch (err: any) { console.error('Erro ao remover CSV temporário:', err.message); }
      // Redireciona para a tela da turma com mensagem
      const adicionados = resultados.filter(r => r.status !== "ignorado").length;
      const ignorados = resultados.filter(r => r.status === "ignorado").length;
      res.redirect(`/turma/${turmaId}/alunos?success=${encodeURIComponent(`${adicionados} alunos importados com sucesso. ${ignorados} ignorados (duplicados).`)}`);
    })
    .on("error", (err: Error) => {
      res.redirect(`/turma/${req.params.id}/alunos?error=${encodeURIComponent('Erro ao processar o CSV: ' + err.message)}`);
    });
}

export async function exportarAlunosCSV(req: Request, res: Response) {
  const turmaId = req.params.id;
  if (!turmaId) {
    return res.status(400).send('Parametro turmaId ausente.');
  }

  // Buscar componentes desta turma
  const [componentes]: any = await pool.query(
    'SELECT id, nome FROM componentes WHERE turma_id = ? ORDER BY id',
    [turmaId]
  );
  const compIds = componentes.map((c: any) => c.id);
  const compNomes = componentes.map((c: any) => c.nome);

  // Buscar aluno_ids pela tabela de relacionamento aluno_turma
  const [alunoTurmas]: any = await pool.query(
    'SELECT aluno_id FROM aluno_turma WHERE turma_id = ?',
    [turmaId]
  );
  const alunoIds = alunoTurmas.map((at: any) => at.aluno_id);
  if (alunoIds.length === 0) {
    return res.status(200).send('Nenhum aluno cadastrado para a turma.');
  }

  // Buscar dados dos alunos
  const [alunos]: any = await pool.query(
    `SELECT id, RA, nome FROM alunos WHERE id IN (${alunoIds.map(() => '?').join(',')}) ORDER BY nome`,
    alunoIds
  );

  // Buscar todas as notas desses alunos e componentes
  const [notas]: any = alunoIds.length && compIds.length
    ? await pool.query(
        `SELECT aluno_id, componente_id, nota FROM notas
         WHERE aluno_id IN (${alunoIds.map(() => '?').join(',')})
           AND componente_id IN (${compIds.map(() => '?').join(',')})`,
        [...alunoIds, ...compIds]
      )
    : [[]];
  const notaMap: Record<string, string> = {};
  for (const n of notas) {
    notaMap[`${n.aluno_id}-${n.componente_id}`] = n.nota;
  }

  // Buscar médias dos alunos na turma
  const [medias]: any = alunoIds.length
    ? await pool.query(
        `SELECT aluno_id, media FROM medias WHERE turma_id = ? AND aluno_id IN (${alunoIds.map(() => '?').join(',')})`,
        [turmaId, ...alunoIds]
      )
    : [[]];
  const mediasMap = Object.fromEntries(medias.map((m: any) => [m.aluno_id, m.media]));

  // Monta cada linha para o CSV
  const alunosCsv = alunos.map((aluno: any) => {
    const linha: any = {
      nome: aluno.nome,
      RA: aluno.RA
    };
    compIds.forEach((compId: number, idx: number) => {
      const notaValor = notaMap[`${aluno.id}-${compId}`];
      linha[compNomes[idx]] = typeof notaValor !== 'undefined' ? notaValor : '';
    });
    linha.media = mediasMap[aluno.id] !== undefined ? Number(mediasMap[aluno.id]).toFixed(2) : '';
    return linha;
  });

  // Cabeçalhos
  const fields = ['RA', 'nome', ...compNomes, 'media'];

  try {
    const csvContent = await parseAsync(alunosCsv, { fields });
    const agora = new Date();
    const nomeArquivo = `${agora.toISOString().slice(0,10)}_${agora.getTime()}-TURMA${turmaId}.csv`;

    res.header('Content-Type', 'text/csv');
    res.attachment(nomeArquivo);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: 'Erro ao exportar CSV', detalhes: error.message });
  }
}
