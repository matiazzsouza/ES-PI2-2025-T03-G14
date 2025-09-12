// src/utils/passwordValidator.ts

//FUNÇÃO PARA FAZER UMA SENHA MAIS FORTE

export function validatePassword(password: string): { valid: boolean; message?: string } {
  // Mínimo 8 caracteres
  if (password.length < 8) {
    return { valid: false, message: "Senha deve ter pelo menos 8 caracteres" };
  }

  // Pelo menos uma letra maiúscula
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "Senha deve ter pelo menos uma letra maiúscula" };
  }

  // Pelo menos uma letra minúscula
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: "Senha deve ter pelo menos uma letra minúscula" };
  }

  // Pelo menos um número
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "Senha deve ter pelo menos um número" };
  }

  // Pelo menos um caractere especial
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, message: "Senha deve ter pelo menos um caractere especial (!@#$%^&*...)" };
  }

  return { valid: true };
}