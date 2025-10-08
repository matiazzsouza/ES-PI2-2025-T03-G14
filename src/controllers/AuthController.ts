import { Request, Response } from "express";
import bcrypt from "bcrypt";
import crypto from "crypto";
import db from "../database/database";
import { addHours } from "date-fns";

export const showForgotPassword = (req: Request, res: Response) => {
  res.render("auth/forgot-password");
};

export const handleForgotPassword = (req: Request, res: Response) => {
  const { email } = req.body;

  db.get("SELECT id FROM users WHERE email = ?", [email], (err, user) => {
    if (!user) return res.send("Email não encontrado!");

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = addHours(new Date(), 1).toISOString();

    db.run(
      "INSERT INTO password_resets (user_id, token, expires_at) VALUES (?, ?, ?)",
      [user.id, token, expiresAt],
      () => {
        const resetLink = `http://localhost:3000/reset-password/${token}`;
        console.log("Link de redefinição:", resetLink);

        res.send("Verifique seu e-mail para redefinir a senha.");
      }
    );
  });
};

export const showResetPassword = (req: Request, res: Response) => {
  const { token } = req.params;
  res.render("auth/reset-password", { token });
};

export const handleResetPassword = (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  db.get("SELECT * FROM password_resets WHERE token = ?", [token], (err, reset) => {
    if (!reset) return res.send("Token inválido.");
    if (new Date(reset.expires_at) < new Date()) return res.send("Token expirado.");

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.run("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, reset.user_id], () => {
      db.run("DELETE FROM password_resets WHERE id = ?", [reset.id]);
      res.send("Senha redefinida com sucesso!");
    });
  });
};
