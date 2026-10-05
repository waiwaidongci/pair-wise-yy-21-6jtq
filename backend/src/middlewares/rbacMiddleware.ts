import type { RequestHandler } from "express";
import { DomainError } from "../utils/errors";

/** 角色白名单：复电确认仅放行调度员/班组长/管理员 */
export const rbacMiddleware =
  (roles: string[] = []): RequestHandler =>
  (req, _res, next) => {
    if (roles.length === 0) return next();
    const role = req.user?.role ?? "";
    if (roles.includes(role) || role === "ADMIN") return next();
    next(new DomainError("RBAC_DENIED", { roles: roles.join(",") }, 403));
  };
