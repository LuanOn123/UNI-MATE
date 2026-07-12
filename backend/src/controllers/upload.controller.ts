import type { Request, Response } from "express";
import { env } from "../config/env.js";
import { asyncHandler } from "../utils/asyncHandler.js";

function normalizeUploadedFileName(fileName: string) {
  const decoded = Buffer.from(fileName, "latin1").toString("utf8");
  return decoded.includes("�") ? fileName : decoded;
}

export const uploadChatFile = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No file uploaded" });
  
  const url = `${env.UPLOAD_BASE_URL}/${req.file.filename}`;
  const fileName = normalizeUploadedFileName(req.file.originalname);
  const mimeType = req.file.mimetype;
  
  let type = "file";
  if (mimeType.startsWith("image/")) type = "image";
  else if (mimeType.startsWith("video/")) type = "video";

  res.status(201).json({ url, type, fileName });
});

export const uploadReportEvidence = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "No image uploaded" });
  if (!req.file.mimetype.startsWith("image/")) return res.status(400).json({ message: "Evidence must be an image" });
  res.status(201).json({ url: `${env.UPLOAD_BASE_URL}/${req.file.filename}` });
});
