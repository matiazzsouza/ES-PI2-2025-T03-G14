import express from "express";
import path from 'path'; // Importação NECESSÁRIA para o path

// 2. CRIAR APLICAÇÃO EXPRESS
const app = express();

// 3. DEFINIR PORTA
const port = 3000;

// ✅ CONFIGURAÇÃO DO EJS (ADICIONADO)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// 4. MIDDLEWARE PARA ENTENDER JSON
app.use(express.json());

// ✅ MIDDLEWARE PARA ARQUIVOS ESTÁTICOS (ADICIONADO)
app.use(express.static('src/public'));

// ✅ MIDDLEWARE PARA FORMULÁRIOS (ADICIONADO)
app.use(express.urlencoded({ extended: true }));

// 5. MIDDLEWARE DE LOG (para ver requests no terminal)
app.use((req, res, next) => {
  console.log(`📥 ${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// 6. ROTA PRINCIPAL (RAIZ)
app.get("/", (req, res) => {
  res.json({ 
    message: "✅ API NotaDez funcionando!",
    timestamp: new Date().toISOString(),
    versao: "1.0.0",
    status: "sucesso"
  });
});

// 7. ROTA DE HEALTH CHECK (saúde do servidor)
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK",
    environment: process.env.NODE_ENV || "development",
    database: "MySQL",
    framework: "Express.js"
  });
});

// ✅ NOVA ROTA PARA A VIEW EJS (ADICIONADA)
app.get("/web", (req, res) => {
  res.render('notes/index', { 
    title: 'Página de Notas',
    versao: '1.0.0'
  });
});

// 8. ROTA DE EXEMPLO PARA PROFESSORES
app.get("/api/professores", (req, res) => {
  res.json({
    data: [],
    message: "Endpoint de professores funcionando!",
    total: 0
  });
});

// 9. INICIAR SERVIDOR
app.listen(port, () => {
  console.log("====================================");
  console.log("🚀 SERVIDOR NOTADEZ INICIADO!");
  console.log("📡 URL: http://localhost:" + port);
  console.log("🩺 Health: http://localhost:" + port + "/health");
  console.log("⭐ API Root: http://localhost:" + port + "/");
  console.log("👨‍🏫 Professores: http://localhost:" + port + "/api/professores");
  console.log("🌐 Página Web: http://localhost:" + port + "/web"); // ✅ LINHA ADICIONADA
  console.log("====================================");
  console.log("⚠️  Pressione Ctrl + C para parar o servidor");
  console.log("====================================");
});

// 10. TRATAMENTO DE ERROS GLOBAIS
process.on("SIGINT", () => {
  console.log("\n🛑 Servidor encerrado pelo usuário");
  process.exit(0);
});

// 11. TRATAMENTO DE ROTAS NÃO ENCONTRADAS (404)
app.use((req, res) => {
  res.status(404).json({
    error: "Rota não encontrada",
    message: `A rota ${req.method} ${req.path} não existe`,
    suggest: "Verifique a documentação da API"
  });
});