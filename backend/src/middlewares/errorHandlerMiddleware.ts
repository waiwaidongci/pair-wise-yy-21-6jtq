import type { ErrorRequestHandler } from "express";
import { DomainError } from "../utils/errors";
import { ERROR_CODES } from "../constants/errorCodes";

/** service/controller 各自包装 DomainError；这里只负责统一出参，不吞业务细节 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof DomainError) {
    res.status(err.status).json({
      code: err.code,
      message: err.message,
      params: err.params
    });
    return;
  }
  console.error("[unhandled]", err);
  res.status(500).json({
    code: ERROR_CODES.INTERNAL_ERROR,
    message: (err as Error)?.message ?? "internal error"
  });
};
