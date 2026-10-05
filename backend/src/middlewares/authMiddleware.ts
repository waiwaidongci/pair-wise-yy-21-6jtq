import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

export interface AuthUser {
  id: number;
  role: string;
  name: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Authenticate the request.
 * - `Authorization: Bearer <jwt>` is verified and decoded.
 * - In development, `x-role` / `x-user-id` headers are accepted as a fallback
 *   so the API can be exercised without minting tokens.
 */
export const authMiddleware: RequestHandler = (req, res, next) => {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length);
    try {
      const payload = jwt.verify(token, config.jwtSecret) as AuthUser;
      req.user = payload;
      return next();
    } catch {
      return res
        .status(401)
        .json({ code: ERROR_CODES.AUTH_REQUIRED, message: ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED] });
    }
  }

  if (config.nodeEnv === "development" && req.header("x-role")) {
    req.user = {
      id: Number(req.header("x-user-id") ?? 1),
      role: req.header("x-role") ?? "dispatcher",
      name: req.header("x-user-name") ?? "dev-user",
    };
    return next();
  }

  return res
    .status(401)
    .json({ code: ERROR_CODES.AUTH_REQUIRED, message: ERROR_MESSAGES[ERROR_CODES.AUTH_REQUIRED] });
};
