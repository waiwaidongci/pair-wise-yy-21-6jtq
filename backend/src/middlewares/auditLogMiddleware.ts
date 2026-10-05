import type { RequestHandler } from "express";

/**
 * 写操作入口留痕；权威审计（复电四件套处置结果）在 service 数据库事务内写 audit_log，
 * 保证“日志与处置结果”同生共死。
 */
export const auditLogMiddleware: RequestHandler = (req, _res, next) => {
  if (req.method !== "GET") {
    console.info(
      "[audit-in]",
      req.method,
      req.path,
      "actor=",
      req.user?.id ?? req.header("x-user-id") ?? "anonymous"
    );
  }
  next();
};
