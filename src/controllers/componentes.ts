import { Request, Response } from "express";
import { pool } from "../database/database-fixed";
import { validateUserSession, getUserFromSession } from "../utils/passainfos";

// Controller POST: adicionar vários componentes na turma
export async function adicionarComponentes(req: Request, res: Response) {
  if (!validateUserSession(req.session)) return res.redirect("/auth/login");
  const turmaId = req.params.id;
  const user = getUserFromSession(req.session);

  // Espera receber:
  // tipo_media: 'aritmetica' ou 'ponderada'
  // componentes: [{ nome: "...", peso: ... }, ...]
  const { tipo_media, componentes } = req.body;

  console.log("📝 adicionarComponentes - Dados recebidos:", { tipo_media, componentes, turmaId });
  console.log("📝 Tipo de componentes:", typeof componentes, Array.isArray(componentes));

  if (!tipo_media || !Array.isArray(componentes) || componentes.length === 0) {
    console.error("❌ adicionarComponentes - Dados inválidos");
    return res.redirect(`/turma/${turmaId}/alunos?error=Preencha todos os campos do componente`);
  }

  try {
    // Obter conexão do pool e garantir autocommit
    const connection = await pool.getConnection();
    console.log("🔗 Conexão obtida do pool para componentes");
    
    // Garantir autocommit habilitado para salvar imediatamente
    await connection.query("SET autocommit = 1");
    
    try {
      let inseridos = 0, ignorados = 0;

      for (const c of componentes) {
        console.log("📋 Processando componente:", c);
        
        // Se ponderada, o peso é obrigatório
        if (tipo_media === 'ponderada' && (!c.peso || isNaN(parseFloat(c.peso)))) {
          console.log("⚠️ Componente ignorado (peso inválido):", c);
          ignorados++;
          continue;
        }

        // Insere componente - SALVANDO DIRETAMENTE NO SQL
        console.log("➕ Inserindo componente DIRETAMENTE NO BANCO SQL:", { turmaId, nome: c.nome, tipo_media, peso: tipo_media === 'ponderada' ? parseFloat(c.peso) : null });
        const [result]: any = await connection.query(
          "INSERT INTO componentes (turma_id, nome, tipo_media, peso) VALUES (?, ?, ?, ?)",
          [
            turmaId,
            c.nome,
            tipo_media,
            tipo_media === 'ponderada' ? parseFloat(c.peso) : null
          ]
        );
        console.log("✅ Componente inserido com ID:", result.insertId, "- Nome:", c.nome);
        console.log("✅ Resultado da inserção:", JSON.stringify(result, null, 2));
        console.log("✅ affectedRows:", result.affectedRows);
        
        // Verificar se realmente foi inserido no banco
        const [verificacao]: any = await connection.query(
          "SELECT * FROM componentes WHERE id = ?", [result.insertId]
        );
        console.log("✅ Verificação pós-inserção no SQL:", verificacao);
        
        if (!verificacao || verificacao.length === 0) {
          console.error("❌ ERRO CRÍTICO: Componente não foi encontrado no SQL após inserção!");
          throw new Error(`Falha ao inserir componente ${c.nome} no banco de dados SQL`);
        }
        
        console.log("✅✅✅ COMPONENTE SALVO COM SUCESSO NO BANCO SQL! ✅✅✅");
        inseridos++;
      }

      // Liberar conexão
      connection.release();
      console.log("🔓 Conexão liberada");
      
      console.log(`✅ Componentes processados: ${inseridos} inseridos, ${ignorados} ignorados`);
      return res.redirect(`/turma/${turmaId}/alunos?success=Componentes adicionados: ${inseridos}, ignorados: ${ignorados}`);
    } catch (dbErr: any) {
      connection.release();
      throw dbErr;
    }
  } catch (err: any) {
    console.error('❌ Erro ao adicionar componentes:', err);
    console.error('Stack:', err.stack);
    console.error('Código do erro:', err.code);
    console.error('Mensagem do erro:', err.message);
    return res.redirect(`/turma/${turmaId}/alunos?error=Erro ao adicionar componentes: ${err.message}`);
  }
}
