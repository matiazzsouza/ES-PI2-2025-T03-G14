import { db } from "NOTA10";
import { Parser } from "csv"

export async function gerarCSVCompleto() {
  
// 1. Buscar dados das tabelas existentes//
const alunos = await db.query("SELECT * FROM alunos");
const turmas = await db.query("SELECT * FROM turmas");
const disciplinas = await db.query("SELECT * FROM disciplinas");
const notas = await db.query("SELECT * FROM notas");
