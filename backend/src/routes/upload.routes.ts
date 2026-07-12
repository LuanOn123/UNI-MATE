import { Router } from "express";
import multer from "multer";
import fs from "node:fs";
import path from "node:path";
import { uploadChatFile, uploadReportEvidence } from "../controllers/upload.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const uploadRouter = Router();

const uploadDir = path.resolve(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// 20MB limit for chat attachments
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } });
const reportImageUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, file.mimetype.startsWith("image/"))
});

uploadRouter.use(requireAuth);
uploadRouter.post("/chat-file", upload.single("file"), uploadChatFile);
uploadRouter.post("/report-evidence", reportImageUpload.single("file"), uploadReportEvidence);
