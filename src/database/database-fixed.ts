// src/database/database-fixed.ts
import mysql from "mysql2/promise";

// Função para criar o pool - approach diferente
export function createDbPool() {
  console.log('🔧 Criando pool de conexão...');
  
  return mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });
}

// Crie e exporte o pool
export const pool = createDbPool();