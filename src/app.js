// src/app.ts
import express from 'express';

const app = express();
const port = 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rota simples de teste
app.get('/', (req, res) => {
  res.json({ 
    message: '✅ API NotaDez funcionando!',
    timestamp: new Date().toISOString(),
    versao: '1.0.0'
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK',
    environment: process.env.NODE_ENV || 'development',
    dependencies: {
      express: '5.1.0',
      mysql2: '3.14.4',
      typescript: '5.9.2'
    }
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${port}`);
  console.log(`📋 Health check: http://localhost:${port}/health`);
  console.log(`⚡ Ambiente: ${process.env.NODE_ENV || 'development'}`);
});