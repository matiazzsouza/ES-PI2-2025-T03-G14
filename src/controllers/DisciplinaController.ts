import { Request, Response } from "express";
import db from "../database/database";

export const listDisciplinas = (req: Request, res: Response) => {
  db.all("SELECT * FROM disciplinas ORDER BY nome", [], (err, rows) => {
    if (err) return res.status(500).send("Erro ao listar disciplinas");
    res.render("disciplinas/index", { disciplinas: rows });
  });
};

export const showNewDisciplina = (req: Request, res: Response) => {
  res.render("disciplinas/new");
};

export const createDisciplina = (req: Request, res: Response) => {
  const { nome, sigla, codigo, periodo } = req.body;
  db.run(
    "INSERT INTO disciplinas (nome, sigla, codigo, periodo) VALUES (?, ?, ?, ?)",
    [nome, sigla, codigo, periodo],
    (err) => {
      if (err) return res.status(500).send("Erro ao criar disciplina");
      res.redirect("/disciplinas");
    }
  );
};

export const deleteDisciplina = (req: Request, res: Response) => {
  const { id } = req.params;
  db.get("SELECT COUNT(*) AS count FROM turmas WHERE disciplina_id = ?", [id], (err, row) => {
    if (row.count > 0)
      return res.send("Não é possível excluir uma disciplina que ainda tem turmas.");

    db.run("DELETE FROM disciplinas WHERE id = ?", [id], (err2) => {
      if (err2) return res.status(500).send("Erro ao excluir disciplina");
      res.redirect("/disciplinas");
    });
  });
};
