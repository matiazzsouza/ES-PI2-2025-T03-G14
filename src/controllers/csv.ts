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
