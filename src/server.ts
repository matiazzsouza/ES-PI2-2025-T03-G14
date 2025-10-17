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

import {
  getUserByEmail, 
  createUser, 
  setUserToSession, 
  clearUserSession,
  validateUserSession, 
  getUserFromSession,
  setResetToken,
  verifyResetToken,
  updatePassword
} from './utils/passainfos';

import {
  exibirPaginaPrimeiroLogin,
  processarPrimeiroLogin
} from "./controllers/primeiro-login"; 

import {
  generateVerificationToken,
  sendPasswordResetEmail,
  sendWelcomeEmail
} from "./utils/manda-redefinir";

import {
  exibirDisciplinas,
  exibirAddDisciplina,
  criarDisciplina,
  editarDisciplina,
  excluirDisciplina
} from './controllers/disciplinas';

import {
  listarTurmasPorDisciplina,
  criarTurma,
  obterTurma,
  editarTurma,
  excluirTurma
} from './controllers/turmas';

import {
  exibirAddTurmas,
  criarMultiplasTurmas
} from './controllers/turmas-routes';

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

        if (user.primeira_vez) {
          return res.redirect("/primeiro-login");
        }

        return res.redirect("/home");
      });

    } catch (err) {
      console.error(err);
      res.render("auth/login", { title: "Login", error: "Erro no login!" });
    }
  });

  //! --- PRIMEIRO LOGIN ---
  app.get("/primeiro-login", exibirPaginaPrimeiroLogin);
  app.post("/primeiro-login", processarPrimeiroLogin);

  
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

      // 🔥 ENVIAR EMAIL DE BOAS-VINDAS
      await sendWelcomeEmail(email, name);

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

      // 🔥 GERAR E ENVIAR TOKEN DE RECUPERAÇÃO
      const resetToken = generateVerificationToken();
      const tokenSaved = await setResetToken(email, resetToken);
      
      if (!tokenSaved) {
        return res.render("auth/recuperacao", {
          title: "Recuperação de Senha",
          error: "Erro ao processar solicitação. Tente novamente.",
          message: null,
          email: email
        });
      }

      const emailSent = await sendPasswordResetEmail(email, resetToken);
      
      if (!emailSent) {
        return res.render("auth/recuperacao", {
          title: "Recuperação de Senha",
          error: "Erro ao enviar email. Tente novamente.",
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

  //! --- REDEFINIÇÃO DE SENHA ---

  app.get("/redefinir-senha/:token", async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await verifyResetToken(token);
      
      if (!user) {
        return res.render("auth/redefinir-senha", {
          title: "Link Inválido",
          error: "Link de redefinição inválido ou expirado.",
          token: null
        });
      }
      
      res.render("auth/redefinir-senha", {
        title: "Redefinir Senha",
        error: null,
        token: token
      });
    } catch (error) {
      console.error("Erro na redefinição:", error);
      res.render("auth/redefinir-senha", {
        title: "Erro",
        error: "Erro ao processar solicitação.",
        token: null
      });
    }
  });

  app.post("/redefinir-senha/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password, confirmPassword } = req.body;
      
      if (password !== confirmPassword) {
        return res.render("auth/redefinir-senha", {
          title: "Redefinir Senha",
          error: "Senhas não coincidem!",
          token: token
        });
      }
      
      const user = await verifyResetToken(token);
      if (!user) {
        return res.render("auth/redefinir-senha", {
          title: "Link Inválido",
          error: "Link de redefinição inválido ou expirado.",
          token: null
        });
      }
      
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.render("auth/redefinir-senha", {
          title: "Redefinir Senha",
          error: passwordValidation.message,
          token: token
        });
      }
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const passwordUpdated = await updatePassword(user.id, hashedPassword);
      
      if (!passwordUpdated) {
        return res.render("auth/redefinir-senha", {
          title: "Erro",
          error: "Erro ao atualizar senha. Tente novamente.",
          token: token
        });
      }
      
      res.redirect("/auth/login?message=Senha redefinida com sucesso!");
      
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      res.render("auth/redefinir-senha", {
        title: "Erro",
        error: "Erro ao redefinir senha. Tente novamente.",
        token: req.params.token
      });
    }
  });

  //! --- HOMEPAGE ---

  app.get("/home", async (req, res) => {
    if (!validateUserSession(req.session)) { 
      return res.redirect("/auth/login");
    }

    const user = getUserFromSession(req.session);
    
    if (!user || !user.id) {
      clearUserSession(req.session);
      return res.redirect("/auth/login");
    }

    try {
      // 🔥 BUSCAR INSTITUIÇÕES COM SEUS CURSOS
      const [instituicoesComCursos]: any = await pool.query(
        `SELECT 
          i.id as instituicao_id,
          i.nome as instituicao_nome,
          i.created_at as instituicao_created_at,
          c.id as curso_id,
          c.nome as curso_nome,
          c.created_at as curso_created_at
          FROM instituicoes i
          LEFT JOIN cursos c ON i.id = c.instituicao_id
          WHERE i.user_id = ?
          ORDER BY i.nome, c.nome`,
        [user.id]
      );

      // 🔥 PROCESSAR OS DADOS: Agrupar cursos por instituição
      const instituicoesMap = new Map();
      
      instituicoesComCursos.forEach((row: any) => {
        const instituicaoId = row.instituicao_id;
        
        if (!instituicoesMap.has(instituicaoId)) {
          instituicoesMap.set(instituicaoId, {
            id: instituicaoId,
            nome: row.instituicao_nome,
            created_at: row.instituicao_created_at,
            cursos: []
          });
        }
        
        // Se existe um curso associado, adiciona à instituição
        if (row.curso_id) {
          instituicoesMap.get(instituicaoId).cursos.push({
            id: row.curso_id,
            nome: row.curso_nome,
            created_at: row.curso_created_at
          });
        }
      });

      const instituicoes = Array.from(instituicoesMap.values());

      // 🔥 CALCULAR TOTAL DE CURSOS
      const totalCursos = instituicoes.reduce((total, instituicao) => {
        return total + (instituicao.cursos ? instituicao.cursos.length : 0);
      }, 0);

      console.log("🔍 Instituições processadas:", instituicoes);
      console.log("🔍 Total de cursos:", totalCursos);

      res.render("home/home", { 
        title: "Página Inicial",
        user: user,
        instituicoes: instituicoes,
        totalCursos: totalCursos,
        totalMaterias: 0,
        totalNotas: 0
      });

    } catch (error) {
      console.error("Erro ao buscar dados para home:", error);
      res.render("home/home", { 
        title: "Página Inicial",
        user: user,
        instituicoes: [],
        totalCursos: 0,
        totalMaterias: 0,
        totalNotas: 0
      });
    }
  });

  //! --- DISCIPLINAS ---
  app.get("/curso/:id/disciplinas", exibirDisciplinas);
  app.get("/curso/:id/disciplinas/add", exibirAddDisciplina);
  app.post("/curso/:id/disciplinas/add", criarDisciplina);

  // API Disciplinas
  app.put("/api/disciplinas/:id", editarDisciplina);
  app.delete("/api/disciplinas/:id", excluirDisciplina);

  //! --- TURMAS ---
  
  app.get("/api/disciplinas/:id/turmas", listarTurmasPorDisciplina);
  app.post("/api/disciplinas/:id/turmas", criarTurma);
  app.get("/api/turmas/:id", obterTurma);
  app.put("/api/turmas/:id", editarTurma);
  app.delete("/api/turmas/:id", excluirTurma);

  // Páginas Turmas (EJS) - Novas rotas para telas
  app.get("/disciplina/:id/turmas/add", exibirAddTurmas);
  app.post("/disciplina/:id/turmas/multiple", criarMultiplasTurmas);


  
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