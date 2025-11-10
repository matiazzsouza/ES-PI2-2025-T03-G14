import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    cb(null, `csv-${timestamp}${path.extname(file.originalname)}`);
  },
});

function csvFileFilter(_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
    cb(null, true);
  } else {
    cb(new Error("Arquivo deve ser CSV"));
  }
}

const upload = multer({
  storage,
  fileFilter: csvFileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }
});

export default upload;
