import { Request, Response } from "express";
import fs from "fs";
import path from "path";
import csvParser from "csv-parser";
// @ts-ignore
import { parseAsync } from "json2csv";
import { pool } from "../database/database-fixed";


export async function importarAlunosCSVController(req: Request, res: Response) {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: "Arquivo CSV não enviado ou não processado pelo servidor." });
  }

  const alunosImportados: { id: string; nome: string }[] = [];
  const alunosExistentes = new Set<string>();

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on("data", (row: any) => {
      const valores = Object.values(row);
      if (valores.length >= 2) {
        const id = String(valores[0]).trim();
        const nome = String(valores[1]).trim();
        if (id && nome && !alunosExistentes.has(id)) {
          alunosImportados.push({ id, nome });
          alunosExistentes.add(id);
        }
      }
    })
    .on("end", () => {
      res.json({ alunos: alunosImportados });
      // fs.unlinkSync(req.file.path); // Remova o arquivo tmp se precisar
    })
    .on("error", (err: Error) => {
      res.status(500).json({ error: "Erro ao processar o CSV", detalhes: err.message });
    });
}



export async function exportarAlunosCSVController(req: Request, res: Response) {
  const turmaId = req.params.turmaId; // Supondo .../api/turma/:turmaId/exportar-csv

  // Busca componentes de nota para a turma
  const [componentes]: any = await pool.query(
    "SELECT id, sigla FROM componentes_nota WHERE turma_id = ? ORDER BY id",
    [turmaId]
  );
  const siglas: string[] = componentes.map((comp: any) => comp.sigla);

  // Busca alunos da turma
  const [alunos]: any = await pool.query(
    "SELECT id, nome FROM alunos WHERE turma_id = ? ORDER BY nome",
    [turmaId]
  );

  // Busca todas as notas lançadas dos alunos
  const alunoIds = alunos.map((aluno: any) => aluno.id);
  const [notas]: any = alunoIds.length
    ? await pool.query(
        `SELECT n.aluno_id, n.componente_nota_id, n.nota, c.sigla 
         FROM notas n
         JOIN componentes_nota c ON c.id = n.componente_nota_id
         WHERE n.aluno_id IN (${alunoIds.map(() => "?").join(",")})`, alunoIds)
    : [ [] ];

  // Monta cada aluno com notas (linhas do CSV)
  const alunosCsv = alunos.map((aluno: any) => {
    const linha: any = { id: aluno.id, nome: aluno.nome };
    siglas.forEach(sigla => {
      const notaObj = notas.find(
        (n: any) => n.aluno_id === aluno.id && n.sigla === sigla
      );
      linha[sigla] = notaObj ? notaObj.nota : "";
    });
    return linha;
  });

  const fields = ["id", "nome", ...siglas];

  try {
    const csvContent = await parseAsync(alunosCsv, { fields });
    const agora = new Date();
    const nomeArquivo = `${agora.toISOString().slice(0,10)}_${agora.getTime()}-TURMA${turmaId}.csv`;

    res.header("Content-Type", "text/csv");
    res.attachment(nomeArquivo);
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ error: "Erro ao exportar CSV", detalhes: error.message });
  }
}
