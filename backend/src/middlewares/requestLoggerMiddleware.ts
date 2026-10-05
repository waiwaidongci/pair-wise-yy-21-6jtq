import type { RequestHandler } from "express";

export const requestLoggerMiddleware: RequestHandler = (req, _res, next) => {
  console.info(`[request] ${req.method} ${req.originalUrl ?? req.path}`);
  next();
};
