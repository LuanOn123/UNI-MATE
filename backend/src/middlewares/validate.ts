import type { NextFunction, Request, Response } from "express";
import type { ZodSchema } from "zod";

export const validate =
  (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse({ body: req.body, params: req.params, query: req.query });
    if (!result.success) {
      const validationIssues = result.error.issues.map((issue) => ({
        path: issue.path.filter((part) => part !== "body").join("."),
        message: issue.message
      }));
      const detailedMessage = validationIssues
        .map((issue) => `${issue.path ? `[${issue.path}]: ` : ""}${issue.message}`)
        .join(" | ");
      return res.status(422).json({
        success: false,
        message: detailedMessage || "Validation failed",
        validationIssues,
        issues: result.error.flatten()
      });
    }
    req.body = result.data.body ?? req.body;
    req.params = result.data.params ?? req.params;
    req.query = result.data.query ?? req.query;
    next();
  };
