import { pool } from '../database/database-fixed';

export interface User {
  id: number;
  name: string;
  email: string;
  telefone: string;
  password_hash: string;
  created_at: Date;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0] || null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

export async function getUserById(id: number): Promise<User | null> {
  try {
    const [rows]: any = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0] || null;
  } catch (error) {
    console.error("Erro ao buscar usuário por ID:", error);
    return null;
  }
}

export async function createUser(name: string, email: string, telefone: string, passwordHash: string): Promise<boolean> {
  try {
    await pool.query(
      "INSERT INTO users (name, email, telefone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, telefone, passwordHash]
    );
    return true;
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return false;
  }
}

export function validateUserSession(session: any): boolean {
  return !!session.user;
}

export function getUserFromSession(session: any): User | null {
  return session.user || null;
}