import { pool } from '../database/database-fixed';

export interface User {
  id: number;
  name: string;
  email: string;
  telefone: string;
  password_hash: string;
  created_at: Date;
  primeira_vez: boolean;
  reset_token?: string;
  reset_expires?: Date;
}

// 🔥 BUSCA USUÁRIO POR EMAIL (COM TOKENS DE REDEFINIÇÃO)
export async function getUserByEmail(email: string): Promise<User | null> {
  try {
    const [rows]: any = await pool.query(
      `SELECT id, name, email, telefone, password_hash, created_at, primeira_vez, 
              reset_token, reset_expires 
       FROM users WHERE email = ?`, 
      [email]
    );
    return rows[0] || null;
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    return null;
  }
}

// 🔥 CRIA USUÁRIO
export async function createUser(name: string, email: string, telefone: string, passwordHash: string): Promise<boolean> {
  try {
    await pool.query(
      "INSERT INTO users (name, email, telefone, password_hash, primeira_vez) VALUES (?, ?, ?, ?, ?)",
      [name, email, telefone, passwordHash, true]
    );
    return true;
  } catch (error: any) {
    console.error("Erro ao criar usuário:", error);
    return false;
  }
}
// 🔥 SALVA TOKEN DE REDEFINIÇÃO NO USUÁRIO
export async function setResetToken(email: string, token: string): Promise<boolean> {
  try {
    console.log("💾 Tentando salvar token para:", email);
    
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);
    
    const [result]: any = await pool.query(
      "UPDATE users SET reset_token = ?, reset_expires = ? WHERE email = ?",
      [token, resetExpires, email]
    );
    
    console.log("💾 Resultado do update:", result.affectedRows, "linhas afetadas");
    return result.affectedRows > 0;
    
  } catch (error: any) {
    console.error("❌ Erro ao definir token de reset:");
    console.error(" - Código:", error.code);
    console.error(" - Mensagem:", error.message);
    return false;
  }
}

// 🔥 VERIFICA SE TOKEN É VÁLIDO
export async function verifyResetToken(token: string): Promise<User | null> {
  try {
    const [rows]: any = await pool.query(
      "SELECT id, email, name FROM users WHERE reset_token = ? AND reset_expires > NOW()",
      [token]
    );
    
    return rows[0] || null;
  } catch (error) {
    console.error("Erro ao verificar token de reset:", error);
    return null;
  }
}

// 🔥 ATUALIZA SENHA E LIMPA TOKENS
export async function updatePassword(userId: number, newPasswordHash: string): Promise<boolean> {
  try {
    const [result]: any = await pool.query(
      "UPDATE users SET password_hash = ?, reset_token = NULL, reset_expires = NULL WHERE id = ?",
      [newPasswordHash, userId]
    );
    
    return result.affectedRows > 0;
  } catch (error) {
    console.error("Erro ao atualizar senha:", error);
    return false;
  }
}

// 🔥 FUNÇÕES DE SESSÃO
export function validateUserSession(session: any): boolean {
  return !!(session && session.user && session.user.id);
}

export function getUserFromSession(session: any): User | null {
  return session?.user || null;
}

export function setUserToSession(session: any, user: User): void {
  if (session) {
    session.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      telefone: user.telefone,
      created_at: user.created_at,
      primeira_vez: user.primeira_vez
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