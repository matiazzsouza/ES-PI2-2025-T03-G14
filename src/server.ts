// src/server.ts
import * as dotenv from "dotenv";
import * as path from "path"; // Importe path primeiro

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from "express";
import session from "express-session"; 
import bcrypt from "bcrypt";
import { pool } from './database/database-fixed';
import { testConnection } from './database/testConnection';
import { validatePassword } from './utils/passwordValidator';
import { 
  getUserByEmail, 
  createUser, 
  validateUserSession, 
  getUserFromSession
} from './utils/passainfos';

// Agora a função getUserByEmail estará disponível


const app = express();
const port = process.env.PORT || 3000;


//* ================= INICIALIZAÇÃO =================

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

  
  //! ================= ROTAS ==================


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

      res.redirect("/home");//!manda diretamente para a pagina inicial


    } catch (err) {
      console.error(err);
      res.render("auth/login", { title: "Login", error: "Erro no login!" });
    }
    
  });

  

  //! --- REGISTRO ---


app.get("/auth/registro", (req, res) => {
  res.render("auth/registro", { 
    title: "Cadastro", 
    error: null,
    passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
  });
});

app.post("/auth/registro", async (req, res) => {
  try {
    const { name, email, telefone ,password, confirmPassword } = req.body;

    // Validar se senhas coincidem
    if (password !== confirmPassword) {
      return res.render("auth/registro", { 
        title: "Cadastro", 
        error: "Senhas não coincidem!",
        passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
      });
    }

    // Validar força da senha
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.render("auth/registro", { 
        title: "Cadastro", 
        error: passwordValidation.message,
        passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
      });
    }

    // Se tudo ok, criar usuário
    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      "INSERT INTO users (name, email, telefone, password_hash) VALUES (?, ?, ?, ?)",
      [name, email, telefone,hashedPassword]
    );

    res.redirect("/auth/login?message=Cadastro realizado com sucesso!");

  } catch (err: any) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.render("auth/registro", { 
        title: "Cadastro", 
        error: "Email já cadastrado!",
        passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
      });
    }
    console.error(err);
    res.render("auth/registro", { 
      title: "Cadastro", 
      error: "Erro no cadastro!",
      passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
    });
  }
});



//! --- RECUPERAÇÃO SENHA ---


app.get("/auth/recuperacao", (req, res) => {
  res.render("auth/recuperacao", { 
    title: "Recuperação de Senha",
    error: null,
    message: null,
    email: ""
  });
});

app.post("/auth/recuperacao", async (req, res) => {
  try {
    const { email } = req.body;

    // Verifica se o email existe
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.render("auth/recuperacao", {
        title: "Recuperação de Senha",
        error: "Email não encontrado em nosso sistema",
        message: null,
        email: email
      });
    }

    // Aqui você implementaria:
    // 1. Gerar token de recuperação
    // 2. Salvar token no banco com expiração
    // 3. Enviar email com link de recuperação

    res.render("auth/recuperacao", {
      title: "Recuperação de Senha",
      error: null,
      message: "Email de recuperação enviado com sucesso! Verifique sua caixa de entrada.",
      email: ""
    });

  } catch (error) {
    console.error("Erro na recuperação de senha:", error);
    res.render("auth/recuperacao", {
      title: "Recuperação de Senha",
      error: "Erro ao processar solicitação. Tente novamente.",
      message: null,
      email: req.body.email
    });
  }
});






//! --- HOMEPAGE ---

app.get("/home", (req, res) => {
  res.render("home/home", { 
    title: "Página Inicial",
    user: { name: "Usuário" }
  });
});



//! --- PÁGINA WEB ---

app.get("/web", (req, res) => {
  res.render("auth/login", { title: "Página Web", error: null });
});



  //! --- HEALTH CHECK ---
  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      database: "MySQL",
      framework: "Express.js",
    });
  });



  //! --- ROTAS NÃO ENCONTRADAS ---
  app.use((req, res) => {
    res.status(404).json({
      error: "Rota não encontrada",
      message: `A rota ${req.method} ${req.path} não existe`,
      suggest: "Verifique a documentação da API",
    });
  });


  //* ================= INICIA SERVIDOR =================
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
