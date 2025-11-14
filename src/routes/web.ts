import express from "express";
import * as csvController from "../controllers/csv";

const router = express.Router();

router.get("/exportar-csv", csvController.exportarCSV);

export default router;
