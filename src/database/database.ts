// src/database/database.ts
import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Função para testar a conexão
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Conectado ao MySQL com sucesso!");
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Erro ao conectar com MySQL:", error);
    return false;
  }
}
