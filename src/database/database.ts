db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT NOT NULL,
    expires_at DATETIME NOT NULL,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )
`);

import sqlite3 from "sqlite3";
const db = new sqlite3.Database("./src/database/db.sqlite");

// Tabela de Disciplinas
db.run(`
CREATE TABLE IF NOT EXISTS disciplinas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nome TEXT NOT NULL,
  sigla TEXT,
  codigo TEXT,
  periodo INTEGER DEFAULT 1,
  instituicao_id INTEGER,
  FOREIGN KEY (instituicao_id) REFERENCES instituicoes(id)
);
`);

// Tabela de Turmas
db.run(`
CREATE TABLE IF NOT EXISTS turmas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  disciplina_id INTEGER NOT NULL,
  nome TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (disciplina_id) REFERENCES disciplinas(id)
);
`);

// Tabela para armazenar pedidos de exclusão de turmas
db.run(`
CREATE TABLE IF NOT EXISTS turma_deletion_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  turma_id INTEGER NOT NULL,
  token TEXT NOT NULL,
  user_id INTEGER,
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (turma_id) REFERENCES turmas(id)
);
`);

// Certifique-se de que a tabela de notas tenha turma_id
try {
  db.run(`ALTER TABLE notes ADD COLUMN turma_id INTEGER;`);
} catch (err) {
  console.log("Coluna turma_id já existe ou tabela notes não criada ainda.");
}

export default db;
