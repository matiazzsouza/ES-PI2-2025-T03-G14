import { Request, Response } from "express";
import db from "../database/database";
import crypto from "crypto";
import { addHours } from "date-fns";
import ejs from "ejs";
import path from "path";
import { sendMail } from "../utils/mailer";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export const listTurmas = (req: Request, res: Response) => {
  const disciplinaId = req.params.disciplinaId;
  db.all("SELECT * FROM turmas WHERE disciplina_id = ?", [disciplinaId], (err, rows) => {
    if (err) return res.status(500).send("Erro ao listar turmas");
    res.render("turmas/index", { turmas: rows, disciplinaId });
  });
};

export const showNewTurma = (req: Request, res: Response) => {
  const { disciplinaId } = req.params;
  res.render("turmas/new", { disciplinaId });
};

export const createTurma = (req: Request, res: Response) => {
  const { disciplinaId } = req.params;
  const { nome } = req.body;

  db.run("INSERT INTO turmas (disciplina_id, nome) VALUES (?, ?)", [disciplinaId, nome], (err) => {
    if (err) return res.status(500).send("Erro ao criar turma");
    res.redirect(`/disciplinas/${disciplinaId}/turmas`);
  });
};

// Solicita exclusão de turma
export const requestDeleteTurma = (req: Request, res: Response) => {
  const { id } = req.params;

  db.get("SELECT COUNT(*) AS count FROM notes WHERE turma_id = ?", [id], (err, row) => {
    if (row.count === 0) {
      db.run("DELETE FROM turmas WHERE id = ?", [id]);
      return res.send("Turma excluída com sucesso!");
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = addHours(new Date(), 1).toISOString();

    db.run(
      "INSERT INTO turma_deletion_requests (turma_id, token, expires_at) VALUES (?, ?, ?)",
      [id, token, expiresAt],
      (err2) => {
        const confirmUrl = `${BASE_URL}/turmas/${id}/confirm-delete/${token}`;
        const emailTemplate = path.join(__dirname, "..", "views", "emails", "confirm-delete-turma.ejs");

        ejs.renderFile(emailTemplate, { confirmUrl }, {}, async (errEjs, html) => {
          await sendMail({
            to: "docente@teste.com",
            subject: "Confirme exclusão da turma",
            html,
          });
          res.send("Um link de confirmação foi enviado para seu e-mail.");
        });
      }
    );
  });
};

// Confirmar exclusão (clicando no link)
export const confirmDeleteTurma = (req: Request, res: Response) => {
  const { id, token } = req.params;

  db.get("SELECT * FROM turma_deletion_requests WHERE turma_id = ? AND token = ?", [id, token], (err, row) => {
    if (!row) return res.send("Link inválido ou expirado.");

    db.run("DELETE FROM notes WHERE turma_id = ?", [id], () => {
      db.run("DELETE FROM turmas WHERE id = ?", [id], () => {
        db.run("DELETE FROM turma_deletion_requests WHERE id = ?", [row.id]);
        res.send("Turma e notas associadas excluídas permanentemente.");
      });
    });
  });
};
