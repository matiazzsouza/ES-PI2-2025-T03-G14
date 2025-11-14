import { exportarCSV } from "../controllers/csv";

router.get("/export/:tabela", exportarCSV);
