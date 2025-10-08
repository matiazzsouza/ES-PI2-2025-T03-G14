import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT || 587);

let transporter: nodemailer.Transporter | null = null;

if (SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export const sendMail = async (opts: { to: string; subject: string; html: string }) => {
  if (!transporter) {
    console.log("📧 Email simulado:", opts);
    return Promise.resolve();
  }

  return transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
  });
};
