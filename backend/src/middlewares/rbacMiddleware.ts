import type { RequestHandler } from "express";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

/**
 * Role-based access control. Usage: `rbacMiddleware(["dispatcher", "admin"])`.
 * Must run after {@link authMiddleware} so `req.user` is populated.
 */
export const rbacMiddleware = (allowedRoles: string[] = []): RequestHandler => {
  return (req, res, next) => {
    const user = req.user;
    if (!user) {
      return res
        .status(401)
        .json({ code: ERROR_CODES.AUTH_REQUIRED, message: ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED] });
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
      return res
        .status(403)
        .json({ code: ERROR_CODES.RBAC_DENIED, message: ERROR_MESSAGES[ERROR_CODES.RBAC_DENIED] });
    }
    next();
  };
};
