// mailgunEmail.ts
import nodemailer from 'nodemailer';
import crypto from 'crypto';




export const transporter = nodemailer.createTransport({
  host: 'smtp.sendgrid.net',
  port: 587,
  auth: {
    user: process.env.SENDGRID_USER, // deve ser 'apikey'
    pass: process.env.SENDGRID_PASS, // sua chave copiada
  },
});


export async function sendPasswordResetEmail(userEmail: string, token: string): Promise<boolean> {
  try {
    console.log("🔄 Conectando ao Mailgun...");
    console.log("📧 De:", process.env.MAILGUN_USER);
    console.log("📧 Para:", userEmail);

    await transporter.verify();
    console.log("✅ Mailgun conectado!");

    const resetLink = `${process.env.BASE_URL}/redefinir-senha/${token}`;

    const info = await transporter.sendMail({
      from: `"NotaDez" <${process.env.SENDGRID_FROM}>`,
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

    console.log("✅ Email enviado para o usuário via Mailgun!");
    console.log("📨 Message ID:", info.messageId);
    return true;

  } catch (error: any) {
    console.error("❌ Erro Mailgun:");
    console.error("Mensagem:", error.message);
    console.error("Código:", error.code);
    return false;
  }
}

// 🔥 EMAIL BOAS-VINDAS
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
  try {
    await transporter.sendMail({
      from: `"NotaDez" <${process.env.MAILGUN_USER}>`,
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

// Gera token seguro para URL de redefinição
export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
