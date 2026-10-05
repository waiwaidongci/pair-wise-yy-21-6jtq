import type { RequestHandler } from "express";
import { DomainError } from "../utils/errors";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 300;

const buckets = new Map<string, { count: number; resetAt: number }>();

/** 轻量内存限流：生产可替换为 Redis 实现，接口形态保持不变 */
export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  const key = `${req.ip}-${req.path}`;
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return next();
  }
  bucket.count += 1;
  if (bucket.count > MAX_REQUESTS) {
    res.setHeader("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
    res.status(429).json({ code: "RATE_LIMITED", message: "请求过于频繁，请稍后再试" });
    return;
  }
  next();
};
