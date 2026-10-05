import type { ErrorRequestHandler } from "express";
import { RestoreConflictError } from "../services/RepairTicketService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * Global error handler (last resort). Controllers wrap service errors
 * themselves; this middleware catches anything that slips through so the
 * client always receives a structured body instead of a default HTML error.
 */
export const errorHandlerMiddleware: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof RestoreConflictError) {
    return res.status(409).json({
      code: err.code,
      message: err.message,
      current_status: err.currentStatus,
      conflict_reason: err.conflictReason,
      current_version: err.currentVersion,
    });
  }

  const status = (err as { status?: number }).status ?? 500;
  const code = (err as { code?: string }).code ?? ERROR_CODES.RESTORE_FAILED;
  const message =
    (err as { message?: string }).message ?? ERROR_MESSAGES[ERROR_CODES.RESTORE_FAILED];

  res.status(status).json({ code, message });
};
