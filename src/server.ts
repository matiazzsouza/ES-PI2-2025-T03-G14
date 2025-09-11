// src/server.ts
import * as dotenv from "dotenv";
import * as path from "path"; // Importe path primeiro

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from "express";
import bcrypt from "bcrypt";
import { pool } from './database/database-fixed';
import { testConnection } from './database/testConnection';

const app = express();
const port = process.env.PORT || 3000;


// ================= INICIALIZAÇÃO =================
async function startServer() {
  const ok = await testConnection();
  if (!ok) {
    console.error("❌ Não foi possível conectar ao banco de dados. Servidor não iniciado.");
    process.exit(1);
  }

  // Configuração EJS
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views")); // Use o path importado acima

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "public")));

  
  // ================= ROTAS ==================

  // Página inicial redireciona para login
  app.get("/", (req, res) => {
    res.redirect("/auth/login");
  });

  // --- LOGIN ---
  app.get("/auth/login", (req, res) => {
    res.render("auth/login", { title: "Login", error: null });
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const [rows]: any = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
      const user = rows[0];

      if (!user) {
        return res.render("auth/login", { title: "Login", error: "Usuário não encontrado!" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.render("auth/login", { title: "Login", error: "Senha incorreta!" });
      }

      res.send(`Bem-vindo ${user.name}!`);
    } catch (err) {
      console.error(err);
      res.render("auth/login", { title: "Login", error: "Erro no login!" });
    }
  });

  // --- REGISTRO ---
  app.get("/auth/registro", (req, res) => {
    res.render("auth/registro", { title: "Cadastro", error: null });
  });

  app.post("/auth/registro", async (req, res) => {
    try {
      const { name, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      await pool.query(
        "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
        [name, email, hashedPassword]
      );

      res.redirect("/auth/login");
    } catch (err: any) {
      if (err.code === "ER_DUP_ENTRY") {
        return res.render("auth/registro", { title: "Cadastro", error: "Email já cadastrado!" });
      }
      console.error(err);
      res.render("auth/registro", { title: "Cadastro", error: "Erro no cadastro!" });
    }
  });

// --- PÁGINA WEB ---
app.get("/web", (req, res) => {
  res.render("auth/login", { title: "Página Web", error: null });
});


  // --- HEALTH CHECK ---
  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      database: "MySQL",
      framework: "Express.js",
    });
  });

  // --- ROTAS NÃO ENCONTRADAS ---
  app.use((req, res) => {
    res.status(404).json({
      error: "Rota não encontrada",
      message: `A rota ${req.method} ${req.path} não existe`,
      suggest: "Verifique a documentação da API",
    });
  });

  // ================= INICIA SERVIDOR =================
  app.listen(port, () => {
    console.log("====================================");
    console.log("🚀 SERVIDOR NOTADEZ INICIADO!");
    console.log(`📡 URL: http://localhost:${port}`);
    console.log(`🩺 Health: http://localhost:${port}/health`);
    console.log(`🔑 Login: http://localhost:${port}/auth/login`);
    console.log(`⭐ Cadastro: http://localhost:${port}/auth/registro`);
    console.log(`🌐 Página Web: http://localhost:${port}/web`);
    console.log("====================================");
  });
}

// Executa
startServer();
