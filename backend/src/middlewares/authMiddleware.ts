import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/env";
import { DomainError } from "../utils/errors";

export interface AuthUser {
  id: number;
  name: string;
  role: string;
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
 * JWT 认证：Authorization: Bearer <token>。
 * 本地开发无 token 时，允许用 x-user-id / x-role 头注入身份（仅非 production）。
 */
export const authMiddleware: RequestHandler = (req, _res, next) => {
  const header = req.header("authorization");
  if (header?.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    try {
      const payload = jwt.verify(token, config.jwt.secret) as jwt.JwtPayload;
      req.user = {
        id: Number(payload.sub ?? payload.id ?? 0),
        name: String(payload.name ?? "dispatcher"),
        role: String(payload.role ?? "DISPATCHER")
      };
      return next();
    } catch {
      return next(new DomainError("AUTH_REQUIRED", {}, 401));
    }
  }

  if (process.env.NODE_ENV !== "production") {
    req.user = {
      id: Number(req.header("x-user-id") ?? 101),
      name: req.header("x-user-name") ?? "本地调度员",
      role: req.header("x-role") ?? "DISPATCHER"
    };
    return next();
  }

  next(new DomainError("AUTH_REQUIRED", {}, 401));
};
