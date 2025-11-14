import { db } from "NOTA10";
import { Parser } from "csv"

export async function gerarCSVCompleto() {
  
// 1. Buscar dados das tabelas existentes//
const alunos = await db.query("SELECT * FROM alunos");
const turmas = await db.query("SELECT * FROM turmas");
const disciplinas = await db.query("SELECT * FROM disciplinas");
const notas = await db.query("SELECT * FROM notas");

const dados = {
        alunos: alunos.rows,
        turmas: turmas.rows,
        disciplinas: disciplinas.rows,
        notas: notas.rows
    };

// 2. Transforma em CSV
    const parser = new Parser();
    const csv = parser.parse(dados);

    return csv;
}
