// src/test-env.ts
import * as dotenv from 'dotenv';

// Carrega as variáveis do arquivo .env
dotenv.config();

console.log('🔍 Testando variáveis de ambiente:');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('PORT:', process.env.PORT);

// A senha não mostre por segurança!
if (process.env.DB_PASSWORD) {
  console.log('DB_PASSWORD: ✅ Configurada (não mostrada por segurança)');
} else {
  console.log('DB_PASSWORD: ❌ Não configurada');
}