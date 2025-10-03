// src/server.ts
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

import express from "express";
import session from "express-session"; 
import bcrypt from "bcrypt";
import { pool } from './database/database-fixed';
import { testConnection } from './database/testConnection';
import { validatePassword } from './utils/passwordValidator';
import {getUserByEmail, createUser, setUserToSession, clearUserSession, validateUserSession, getUserFromSession} from './utils/passainfos';

const app = express();
const port = process.env.PORT || 3000;

//* ================================ INICIALIZAÇÃO ============================== 

async function startServer() {
  const ok = await testConnection();
  if (!ok) {
    console.error("❌ Não foi possível conectar ao banco de dados.");
    process.exit(1);
  }

  // Configuração EJS
  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "views"));

  // Middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, "public")));
  
  const session = require('express-session');
  app.use(session({
    secret: process.env.SESSION_SECRET || 'notadez-secret-key',
    resave: false,
    saveUninitialized: false
  }));

  app.use((req, res, next) => {
    res.locals.user = (req.session as any).user || null;
    next();
  });

  //?================= ROTAS =================

  //! --- LOGIN ---

  app.get("/auth/login", (req, res) => {
    res.render("auth/login", { title: "Login", error: null });
  });

  app.post("/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await getUserByEmail(email); 
      if (!user) {
        return res.render("auth/login", { title: "Login", error: "Usuário não encontrado!" });
      }

      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.render("auth/login", { title: "Login", error: "Senha incorreta!" });
      }

      setUserToSession(req.session, user);

      (req.session as any).save(async (err: any) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.render("auth/login", { title: "Login", error: "Erro no login!" });
        }

        // ✅ Se É a primeira vez (primeira_vez = true)
        if (user.primeira_vez) {
          return res.redirect("/primeiro-login");
        }

        // ✅ Se JÁ entrou antes → vai para home
        return res.redirect("/home");
      });

    } catch (err) {
      console.error(err);
      res.render("auth/login", { title: "Login", error: "Erro no login!" });
    }
  });

  //! --- PRIMEIRO-LOGIN ---

  app.get("/primeiro-login", (req, res) => {
    if (!validateUserSession(req.session)) {
      return res.redirect("/auth/login");
    }
    
    const user = getUserFromSession(req.session);
    res.render("home/primeiro-login", { 
      title: "Primeiro Acesso",
      user: user,
      error: null
    });
  });

  app.post("/primeiro-login", async (req, res) => {
    const user = getUserFromSession(req.session);
    if (!user) return res.redirect("/auth/login");

    try {
      const { institutions, courses } = req.body;

      // Validação
      if (!institutions || !courses || 
          !Array.isArray(institutions) || !Array.isArray(courses) ||
          institutions.length === 0 || courses.length === 0) {
        
        return res.render("home/primeiro-login", {
          title: "Primeiro Acesso",
          user: user,
          error: "É necessário informar pelo menos uma instituição e um curso."
        });
      }

      const connection = await pool.getConnection();
      await connection.beginTransaction();

      try {
        // Inserir instituições
        for (const instituicao of institutions) {
          if (instituicao.trim()) {
            const [instResult]: any = await connection.query(
              "INSERT INTO instituicoes (nome, user_id) VALUES (?, ?)",
              [instituicao.trim(), user.id]
            );

            // Inserir cursos
            for (const curso of courses) {
              if (curso.trim()) {
                await connection.query(
                  "INSERT INTO cursos (nome, instituicao_id, user_id) VALUES (?, ?, ?)",
                  [curso.trim(), instResult.insertId, user.id]
                );
              }
            }
          }
        }

        // Atualizar flag de primeira vez
        await connection.query(
          "UPDATE users SET primeira_vez = FALSE WHERE id = ?",
          [user.id]
        );

        await connection.commit();

        // Atualizar sessão
        const updatedUser = await getUserByEmail(user.email);
        if (updatedUser) {
          setUserToSession(req.session, updatedUser);
        }

        res.redirect("/home");

      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }

    } catch (error) {
      console.error("Erro no primeiro login:", error);
      res.render("home/primeiro-login", { 
        title: "Primeiro Acesso",
        user: user,
        error: "Erro ao salvar configurações. Tente novamente."
      });
    }
  });

  //! --- LOGOUT --- 

  app.get("/auth/logout", (req, res) => {
    clearUserSession(req.session);
    res.redirect("/auth/login");
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
      const { name, email, telefone, password, confirmPassword } = req.body;

      if (password !== confirmPassword) {
        return res.render("auth/registro", { 
          title: "Cadastro", 
          error: "Senhas não coincidem!",
          passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
        });
      }

      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.render("auth/registro", { 
          title: "Cadastro", 
          error: passwordValidation.message,
          passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const created = await createUser(name, email, telefone, hashedPassword); 
      if (!created) {
        return res.render("auth/registro", { 
          title: "Cadastro", 
          error: "Erro ao cadastrar usuário!",
          passwordRequirements: "Senha deve ter: 8+ caracteres, maiúscula, minúscula, número e caractere especial"
        });
      }

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

      const user = await getUserByEmail(email); 
      
      if (!user) {
        return res.render("auth/recuperacao", {
          title: "Recuperação de Senha",
          error: "Email não encontrado em nosso sistema",
          message: null,
          email: email
        });
      }

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
    if (!validateUserSession(req.session)) { 
      return res.redirect("/auth/login");
    }

    const user = getUserFromSession(req.session)

    res.render("home/home", { 
      title: "Página Inicial",
      user: user
    });
  });

  //! --- PÁGINA WEB ---
  app.get("/web", (req, res) => {
    res.render("auth/login", { title: "Página Web", error: null });
  });

  // HEALTH CHECK
  app.get("/health", (req, res) => {
    res.json({
      status: "OK",
      environment: process.env.NODE_ENV || "development",
      database: "MySQL"
    });
  });

  // ROTAS NÃO ENCONTRADAS
  app.use((req, res) => {
    res.status(404).json({
      error: "Rota não encontrada",
      message: `A rota ${req.method} ${req.path} não existe`,
      suggest: "Verifique a documentação da API",
    });
  });

  //?  ===== INICIA SERVIDOR ===============
  app.listen(port, () => {
    console.log("====================================");
    console.log("🚀 SERVIDOR NOTADEZ INICIADO!");
    console.log(`📡 WEB: http://localhost:${port}/web`);
    console.log("====================================");
  });
}

startServer().catch(error => {
  console.error("❌ Erro ao iniciar servidor:", error);
  process.exit(1);
});