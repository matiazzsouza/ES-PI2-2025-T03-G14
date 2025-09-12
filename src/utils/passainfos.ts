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
  return !!session?.['user']; // ✅ Use bracket notation
}

export function getUserFromSession(session: any): User | null {
  return session?.['user'] || null; // ✅ Use bracket notation
}

export function setUserToSession(session: any, user: User): void {
  if (session) {
    session['user'] = { // ✅ Use bracket notation
      id: user.id,
      name: user.name,
      email: user.email,
      telefone: user.telefone,
      created_at: user.created_at
    };
  }
}
export function clearUserSession(session: any): void {
  if (session) {
    session.user = null;
    session.destroy((err: any) => {
      if (err) {
        console.error("Erro ao destruir sessão:", err);
      }
    });
  }
}