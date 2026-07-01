import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, res: Response) {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  const message = err instanceof Error ? err.message : "Unexpected error";
  const statusCode = typeof err === "object" && err && "statusCode" in err ? Number((err as { statusCode: unknown }).statusCode) : 500;
  console.error(err);
  res.status(Number.isFinite(statusCode) ? statusCode : 500).json({ success: false, message });
}
