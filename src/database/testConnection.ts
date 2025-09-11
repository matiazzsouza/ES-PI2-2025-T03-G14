// src/database/testConnection.ts
import { pool } from './database-fixed';

export async function testConnection() {
  try {
    console.log('🔄 Testando conexão via pool...');

    // Teste uma query simples
    const [rows]: any = await pool.query('SELECT 1 + 1 as result');
    console.log('✅ Conexão bem-sucedida! Resultado:', rows[0].result);

    return true;
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}