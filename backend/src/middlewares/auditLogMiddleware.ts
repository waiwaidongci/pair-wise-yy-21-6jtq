import type { RequestHandler } from "express";

/**
 * Structured audit log. Records the actor, method, path and status for every
 * mutating request so write operations are traceable.
 */
export const auditLogMiddleware: RequestHandler = (req, res, next) => {
  const startedAt = Date.now();
  res.on("finish", () => {
    const actor = req.user ? `${req.user.role}:${req.user.id}` : "anonymous";
    const entry = {
      ts: new Date().toISOString(),
      actor,
      method: req.method,
      path: req.originalUrl ?? req.path,
      status: res.statusCode,
      ms: Date.now() - startedAt,
    };
    if (req.method !== "GET") {
      console.info("[audit]", JSON.stringify(entry));
    }
  });
  next();
};
