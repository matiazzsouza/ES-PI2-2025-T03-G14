import { getUserByEmail, setUserToSession, validateUserSession, getUserFromSession, User } from "../utils/passainfos";
import { salvarInstituicoesECursos } from "../services/primeiro-login-service";

/**
 * 🔹 Exibe a página do primeiro login (GET /primeiro-login)
 */
export function exibirPaginaPrimeiroLogin(req: any, res: any) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const user = getUserFromSession(req.session);
  res.render("home/primeiro-login", {
    title: "Primeiro Acesso",
    user,
    error: null
  });
}


 // 🔹 Processa o envio do formulário do primeiro login (POST /primeiro-login)

export async function processarPrimeiroLogin(req: any, res: any) {
  if (!validateUserSession(req.session)) {
    return res.redirect("/auth/login");
  }

  const user = getUserFromSession(req.session) as User | null;
  if (!user) return res.redirect("/auth/login");

  try {
    const { instituicoes } = req.body;

    // Validação básica
    if (!instituicoes || !Array.isArray(instituicoes) || instituicoes.length === 0) {
      return res.render("home/primeiro-login", {
        title: "Primeiro Acesso",
        user,
        error: "É necessário informar pelo menos uma instituição."
      });
    }

    // Verifica que cada instituição tem pelo menos um curso
    for (const instituicao of instituicoes) {
      if (
        !instituicao.nome?.trim() ||
        !instituicao.cursos ||
        !Array.isArray(instituicao.cursos) ||
        instituicao.cursos.length === 0
      ) {
        return res.render("home/primeiro-login", {
          title: "Primeiro Acesso",
          user,
          error: "Cada instituição deve ter pelo menos um curso."
        });
      }
    }

    // Salva tudo no banco via service
    await salvarInstituicoesECursos(user.id, instituicoes);

    // Atualiza sessão com o usuário atualizado
    const updatedUser = await getUserByEmail(user.email);
    if (updatedUser) setUserToSession(req.session, updatedUser);

    // Redireciona para a home
    res.redirect("/home");
  } catch (error) {
    console.error("Erro no primeiro login:", error);
    res.render("home/primeiro-login", {
      title: "Primeiro Acesso",
      user,
      error: "Erro ao salvar configurações. Tente novamente."
    });
  }
}
