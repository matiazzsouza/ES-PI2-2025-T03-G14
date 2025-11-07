import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";



export async function exibirPaginaAlunos(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  // Mensagens de feedback
  const success = req.query.success ? String(req.query.success) : null;
  const error = req.query.error ? String(req.query.error) : null;

  try {
    // Buscar turma com disciplina_id
    const [turmaRows]: any = await pool.query(
      `SELECT t.id, t.nome, t.disciplina_id, d.curso_id, d.nome as disciplina_nome
       FROM turmas t
       JOIN disciplinas d ON t.disciplina_id = d.id
       WHERE t.id = ?`, 
      [turmaId]
    );
    const turma = turmaRows.length ? turmaRows[0] : null;

    if (!turma) {
      return res.redirect("/home?error=Turma não encontrada");
    }

    // Buscar alunos da turma
    const [alunosRows]: any = await pool.query(
      `SELECT a.id, a.RA, a.nome
         FROM aluno_turma at
         JOIN alunos a ON at.aluno_id = a.id
         WHERE at.turma_id = ?
         ORDER BY a.nome`,
      [turmaId]
    );

    // Buscar componentes da turma
    const [componentesRows]: any = await pool.query(
      `SELECT id, nome, tipo_media, peso
       FROM componentes
       WHERE turma_id = ?
       ORDER BY id`,
      [turmaId]
    );

    // Buscar todas as notas (aluno_id, componente_id, valor)
    const alunoIds = alunosRows.map((a: any) => a.id);
    const componenteIds = componentesRows.map((c: any) => c.id);
    
    let notasObj: any = {};
    if (alunoIds.length > 0 && componenteIds.length > 0) {
      try {
        const [notasRows]: any = await pool.query(
          `SELECT aluno_id, componente_id, valor
           FROM notas
           WHERE aluno_id IN (${alunoIds.map(() => '?').join(',')})
           AND componente_id IN (${componenteIds.map(() => '?').join(',')})`,
          [...alunoIds, ...componenteIds]
        );
        
        // Criar objeto: "aluno_id-componente_id" => valor
        notasRows.forEach((nota: any) => {
          const key = `${nota.aluno_id}-${nota.componente_id}`;
          notasObj[key] = nota.valor;
        });
      } catch (notaErr) {
        console.error("Erro ao buscar notas:", notaErr);
        // Continua sem notas se houver erro
      }
    }

    res.render("alunos/alunos", {
      title: "Grade de Alunos",
      turma,
      disciplina: {
        id: turma.disciplina_id,
        nome: turma.disciplina_nome,
        curso_id: turma.curso_id
      },
      alunos: alunosRows,
      componentes: componentesRows,
      notas: notasObj,
      user,
      success,
      error
    });
  } catch (err) {
    console.error("Erro ao carregar tela de alunos:", err);
    res.status(500).render("alunos/alunos", {
      title: "Grade de Alunos",
      turma: null,
      disciplina: null,
      alunos: [],
      componentes: [],
      notas: {},
      user,
      success: null,
      error: "Erro ao buscar dados da turma."
    });
  }
}

export async function AdicionarAluno(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  const { RA, nome } = req.body;
  
  console.log("📝 AdicionarAluno - Dados recebidos:", { RA, nome, turmaId });
  
  if (!RA || !nome) {
    console.error("❌ AdicionarAluno - RA ou nome vazio");
    return res.redirect(`/turma/${turmaId}/alunos?error=Informe RA e Nome do aluno`);
  }

  try {
    // Obter conexão do pool e iniciar transação
    const connection = await pool.getConnection();
    console.log("🔗 Conexão obtida do pool");
    
    // Garantir autocommit habilitado para salvar imediatamente
    await connection.query("SET autocommit = 1");
    
    try {
      // Verifica se já existe aluno com esse RA
      console.log("🔍 Verificando se aluno existe com RA:", RA);
      const [existente]: any = await connection.query(
        "SELECT id FROM alunos WHERE RA = ?", [RA]
      );
      console.log("🔍 Resultado da busca:", existente);

      let alunoId: number;
      let jaExistia = false;
      if (existente && existente.length > 0) {
        alunoId = existente[0].id;
        jaExistia = true;
        console.log("ℹ️ Aluno já existe com ID:", alunoId);
      } else {
        // Cadastra novo aluno - SALVANDO DIRETAMENTE NO SQL
        console.log("➕ Inserindo novo aluno DIRETAMENTE NO BANCO SQL...");
        console.log("📝 Query: INSERT INTO alunos (RA, nome) VALUES (?, ?)", [RA, nome]);
        
        const [result]: any = await connection.query(
          "INSERT INTO alunos (RA, nome) VALUES (?, ?)", [RA, nome]
        );
        
        alunoId = result.insertId;
        console.log("✅ Novo aluno criado com ID:", alunoId);
        console.log("✅ Resultado da inserção:", JSON.stringify(result, null, 2));
        console.log("✅ insertId:", result.insertId);
        console.log("✅ affectedRows:", result.affectedRows);
        
        // Verificar se realmente foi inserido no banco
        const [verificacao]: any = await connection.query(
          "SELECT * FROM alunos WHERE id = ?", [alunoId]
        );
        console.log("✅ Verificação pós-inserção no SQL:", verificacao);
        
        if (!verificacao || verificacao.length === 0) {
          console.error("❌ ERRO CRÍTICO: Aluno não foi encontrado no SQL após inserção!");
          throw new Error("Falha ao inserir aluno no banco de dados SQL");
        }
        
        console.log("✅✅✅ ALUNO SALVO COM SUCESSO NO BANCO SQL! ✅✅✅");
      }

      // Vincula aluno à turma - SALVANDO DIRETAMENTE NO SQL
      // Verifica se já está vinculado à turma
      const [vinculo]: any = await connection.query(
        "SELECT * FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?", [alunoId, turmaId]
      );
      
      if (vinculo.length > 0) {
        console.log("⚠️ Aluno já está vinculado à turma");
        connection.release();
        return res.redirect(`/turma/${turmaId}/alunos?error=Aluno já está cadastrado nesta turma`);
      }
      
      // Se não, vincula normalmente - SALVANDO DIRETAMENTE NO SQL
      console.log("🔗 Vinculando aluno à turma DIRETAMENTE NO BANCO SQL:", { alunoId, turmaId });
      const [resultVinculo]: any = await connection.query(
        "INSERT INTO aluno_turma (aluno_id, turma_id) VALUES (?, ?)", [alunoId, turmaId]
      );
      console.log("✅ Aluno vinculado à turma:", { alunoId, turmaId });
      console.log("✅ Resultado do vínculo:", JSON.stringify(resultVinculo, null, 2));
      
      // Verificar se realmente foi vinculado no banco
      const [verificacaoVinculo]: any = await connection.query(
        "SELECT * FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?", [alunoId, turmaId]
      );
      console.log("✅ Verificação do vínculo no SQL:", verificacaoVinculo);
      console.log("✅✅✅ VÍNCULO SALVO COM SUCESSO NO BANCO SQL! ✅✅✅");
      
      // Liberar conexão
      connection.release();
      console.log("🔓 Conexão liberada");
      
      const msg = jaExistia ? "Aluno já existia, vinculado à turma" : "Aluno adicionado com sucesso";
      return res.redirect(`/turma/${turmaId}/alunos?success=${encodeURIComponent(msg)}`);

    } catch (dbErr: any) {
      connection.release();
      throw dbErr;
    }
  } catch (err: any) {
    console.error("❌ Erro ao adicionar aluno:", err);
    console.error("Stack:", err.stack);
    console.error("Código do erro:", err.code);
    console.error("Mensagem do erro:", err.message);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao adicionar aluno: ${err.message}`);
  }
}

// Salvar/Atualizar nota de um aluno em um componente - SALVANDO DIRETAMENTE NO SQL
export async function salvarNota(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const { aluno_id, componente_id, valor } = req.body;

  if (!aluno_id || !componente_id) {
    return res.status(400).json({ error: "Aluno e componente são obrigatórios" });
  }

  try {
    // Obter conexão e garantir autocommit
    const connection = await pool.getConnection();
    await connection.query("SET autocommit = 1");
    
    try {
      // Verificar se a nota já existe
      const [existentes]: any = await connection.query(
        "SELECT id FROM notas WHERE aluno_id = ? AND componente_id = ?",
        [aluno_id, componente_id]
      );

      if (existentes.length > 0) {
        // Atualizar nota existente - SALVANDO DIRETAMENTE NO SQL
        console.log("📝 Atualizando nota DIRETAMENTE NO BANCO SQL:", { aluno_id, componente_id, valor });
        await connection.query(
          "UPDATE notas SET valor = ? WHERE aluno_id = ? AND componente_id = ?",
          [valor || null, aluno_id, componente_id]
        );
        console.log("✅✅✅ NOTA ATUALIZADA COM SUCESSO NO BANCO SQL! ✅✅✅");
      } else {
        // Inserir nova nota - SALVANDO DIRETAMENTE NO SQL
        console.log("➕ Inserindo nota DIRETAMENTE NO BANCO SQL:", { aluno_id, componente_id, valor });
        const [result]: any = await connection.query(
          "INSERT INTO notas (aluno_id, componente_id, valor) VALUES (?, ?, ?)",
          [aluno_id, componente_id, valor || null]
        );
        console.log("✅ Nota inserida com ID:", result.insertId);
        console.log("✅✅✅ NOTA SALVA COM SUCESSO NO BANCO SQL! ✅✅✅");
      }

      connection.release();
      return res.json({ success: true });
    } catch (dbErr: any) {
      connection.release();
      throw dbErr;
    }
  } catch (err: any) {
    console.error("❌ Erro ao salvar nota:", err);
    console.error("Código do erro:", err.code);
    console.error("Mensagem do erro:", err.message);
    return res.status(500).json({ error: "Erro ao salvar nota: " + err.message });
  }
}

// Importar alunos via CSV
export async function importarAlunosCSV(req: Request, res: Response) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const turmaId = req.params.id;
  const file = (req as any).file;

  if (!file) {
    return res.redirect(`/turma/${turmaId}/alunos?error=Arquivo CSV não enviado`);
  }

  try {
    const csvParser = require('csv-parser');
    const fs = require('fs');
    const alunosImportados: { RA: string; nome: string }[] = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(file.path)
        .pipe(csvParser())
        .on('data', (row: any) => {
          // Aceita diferentes formatos: RA/nome, id/nome, etc.
          const valores = Object.values(row);
          if (valores.length >= 2) {
            const RA = String(valores[0]).trim();
            const nome = String(valores[1]).trim();
            if (RA && nome) {
              alunosImportados.push({ RA, nome });
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    let adicionados = 0;
    let jaExistentes = 0;

    // Obter conexão e garantir autocommit para salvar diretamente no SQL
    const connection = await pool.getConnection();
    await connection.query("SET autocommit = 1");
    
    try {
      for (const aluno of alunosImportados) {
        // Verifica se aluno já existe
        const [existente]: any = await connection.query(
          "SELECT id FROM alunos WHERE RA = ?", [aluno.RA]
        );

        let alunoId: number;
        if (existente.length > 0) {
          alunoId = existente[0].id;
          jaExistentes++;
        } else {
          // Cria novo aluno - SALVANDO DIRETAMENTE NO SQL
          console.log("➕ Importando aluno DIRETAMENTE NO BANCO SQL:", aluno);
          const [result]: any = await connection.query(
            "INSERT INTO alunos (RA, nome) VALUES (?, ?)",
            [aluno.RA, aluno.nome]
          );
          alunoId = result.insertId;
          adicionados++;
          console.log("✅ Aluno importado com ID:", alunoId);
        }

        // Vincula à turma (se ainda não estiver vinculado) - SALVANDO DIRETAMENTE NO SQL
        const [vinculo]: any = await connection.query(
          "SELECT * FROM aluno_turma WHERE aluno_id = ? AND turma_id = ?",
          [alunoId, turmaId]
        );

        if (vinculo.length === 0) {
          await connection.query(
            "INSERT INTO aluno_turma (aluno_id, turma_id) VALUES (?, ?)",
            [alunoId, turmaId]
          );
          console.log("✅ Aluno vinculado à turma:", { alunoId, turmaId });
        }
      }
      
      connection.release();
    } catch (dbErr: any) {
      connection.release();
      throw dbErr;
    }

    // Limpar arquivo temporário
    if (file.path) {
      fs.unlinkSync(file.path);
    }

    return res.redirect(
      `/turma/${turmaId}/alunos?success=${encodeURIComponent(
        `Importação concluída: ${adicionados} novos, ${jaExistentes} já existentes`
      )}`
    );
  } catch (err) {
    console.error("Erro ao importar alunos:", err);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao importar alunos do CSV`);
  }
}
