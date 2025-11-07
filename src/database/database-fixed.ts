// src/database/database-fixed.ts
import mysql from "mysql2/promise";

// Função para criar o pool - usando mesmas configurações padrão do C:\NotaDez
export function createDbPool() {
  console.log('🔧 Criando pool de conexão...');
  
  // Usar valores padrão como no projeto C:\NotaDez
  const config = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'notadez_db', // Ajustado para notadez_db conforme visto no MySQL
    port: parseInt(process.env.DB_PORT || '3306'),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    multipleStatements: false,
    // Garantir que autocommit está habilitado por padrão
    // Isso garante que todas as queries sejam commitadas imediatamente
  };
  
  console.log('📋 Configuração do banco:', {
    host: config.host,
    user: config.user,
    database: config.database,
    port: config.port,
    hasPassword: config.password ? 'Sim' : 'Não'
  });
  
  const pool = mysql.createPool(config);
  
  // Testar conexão
  pool.getConnection()
    .then(connection => {
      console.log('✅ Conexão com banco de dados estabelecida!');
      connection.release();
    })
    .catch(err => {
      console.error('❌ Erro ao conectar ao banco de dados:', err.message);
    });
  
  return pool;
}

// Crie e exporte o pool
export const pool = createDbPool();