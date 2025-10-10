import nodemailer from 'nodemailer';
import crypto from 'crypto';

// ✅ CONFIGURAÇÃO ELASTIC EMAIL
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || "smtp.elasticemail.com",
  port: parseInt(process.env.EMAIL_PORT || '2525'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 🔥 ENVIA EMAIL DE REDEFINIÇÃO
export async function sendPasswordResetEmail(userEmail: string, token: string): Promise<boolean> {
  try {
    console.log("🔄 Conectando ao Elastic Email...");
    console.log("📧 De:", process.env.EMAIL_USER);
    console.log("📧 Para:", userEmail);
    
    await transporter.verify();
    console.log("✅ Elastic Email conectado!");

    const resetLink = `${process.env.BASE_URL}/redefinir-senha/${token}`;
    
    const info = await transporter.sendMail({
      from: `"NotaDez" <${process.env.EMAIL_USER}>`,  // ← Seu email do Elastic Email
      to: userEmail,
      subject: 'Redefinição de Senha - NotaDez',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Redefinir Senha - NotaDez</h2>
          <p>Clique no link abaixo para redefinir sua senha:</p>
          
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetLink}" 
               style="background-color: #dc2626; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 5px; display: inline-block;">
              🔒 REDEFINIR MINHA SENHA
            </a>
          </div>
          
          <p><strong>⚠️ Este link expira em 1 hora.</strong></p>
          <p>Se você não solicitou esta redefinição, ignore este email.</p>
        </div>
      `
    });

    console.log("✅ Email enviado para o usuário via Elastic Email!");
    console.log("📨 Message ID:", info.messageId);
    return true;

  } catch (error: any) {
    console.error("❌ Erro Elastic Email:");
    console.error("Mensagem:", error.message);
    console.error("Código:", error.code);
    return false;
  }
}

// 🔥 EMAIL BOAS-VINDAS
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"NotaDez" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Bem-vindo ao NotaDez! 🎉',
      html: `
        <div style="font-family: Arial, sans-serif;">
          <h2 style="color: #2563eb;">Bem-vindo, ${userName}! 🎉</h2>
          <p>Sua conta foi criada com sucesso no <strong>NotaDez</strong>.</p>
          <a href="${process.env.BASE_URL}/auth/login" 
             style="background-color: #2563eb; color: white; padding: 10px 20px; 
                    text-decoration: none; border-radius: 5px; display: inline-block;">
            🚀 ACESSAR MINHA CONTA
          </a>
        </div>
      `
    });
    console.log("✅ Email de boas-vindas enviado!");
    return true;
  } catch (error: any) {
    console.error("❌ Erro email boas-vindas:", error.message);
    return false;
  }
}

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}