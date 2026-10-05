import type { Request, Response } from "express";
import { repairTicketService, RestoreConflictError } from "../services/RepairTicketService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { RestoreTicketPayload } from "../types/RepairTicketPayload";

export const repairTicketController = {
  list: (_req: Request, res: Response) => {
    res.json(repairTicketService.list());
  },

  get: (req: Request, res: Response) => {
    const ticket = repairTicketService.get(req.params.id);
    if (!ticket) {
      return res
        .status(404)
        .json({ code: ERROR_CODES.TICKET_NOT_FOUND, message: ERROR_MESSAGES[ERROR_CODES.TICKET_NOT_FOUND] });
    }
    res.json(ticket);
  },

  create: (req: Request, res: Response) => {
    res.status(201).json(repairTicketService.create(req.body));
  },

  /**
   * POST /api/repair-ticket/:id/restore
   * Confirm restoration. The service enforces idempotency, optimistic
   * first-writer-wins, and cross-entity recomputation. Conflicts are mapped
   * to HTTP 409 with the current ticket status and the conflict reason.
   */
  restore: async (req: Request, res: Response) => {
    try {
      const payload: RestoreTicketPayload = {
        dispatcher_id: req.body?.dispatcher_id,
        expected_version: req.body?.expected_version,
        idempotency_key: req.body?.idempotency_key,
      };
      const result = await repairTicketService.restore(req.params.id, payload);
      res.json(result);
    } catch (err) {
      if (err instanceof RestoreConflictError) {
        return res.status(409).json({
          code: err.code,
          message: err.message,
          current_status: err.currentStatus,
          conflict_reason: err.conflictReason,
          current_version: err.currentVersion,
        });
      }
      res.status(500).json({
        code: ERROR_CODES.RESTORE_FAILED,
        message: ERROR_MESSAGES[ERROR_CODES.RESTORE_FAILED],
      });
    }
  },
};
