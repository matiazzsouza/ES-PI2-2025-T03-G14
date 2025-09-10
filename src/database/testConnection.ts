// src/database/testConnection.ts
import { pool } from './database';

// Exporta a função para ser usada em outros arquivos
export async function testConnection() {
  try {
    console.log('🔄 Testando conexão básica...');

    if (pool) {
      const [rows]: any = await pool.query('SELECT 1 + 1 as result');
      console.log('✅ Conexão bem-sucedida! Resultado:', rows[0].result);

      const [versionRows]: any = await pool.query('SELECT VERSION() as version');
      console.log('📦 Versão do MySQL:', versionRows[0].version);
    } else {
      console.log('❌ Pool é undefined - verifique a exportação do arquivo database.ts');
    }

    return true;
  } catch (error: any) {
    console.error('❌ Erro de conexão:', error.message);
    return false;
  }
}
