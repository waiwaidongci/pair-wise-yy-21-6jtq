import type { RequestHandler } from "express";

export const requestLoggerMiddleware: RequestHandler = (req, res, next) => {
  const start = Date.now();
  res.once("finish", () => {
    console.info(
      `${req.method} ${req.originalUrl} user=${req.user?.id ?? "anonymous"} ${res.statusCode} ${Date.now() - start}ms`
    );
  });
  next();
};
