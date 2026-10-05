import type { RequestHandler } from "express";
import { config } from "../config/env";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter keyed by client IP.
 * Enforces `config.rateLimitMax` requests per `config.rateLimitWindowMs`.
 */
export const rateLimitMiddleware: RequestHandler = (req, res, next) => {
  const key = req.ip ?? req.socket.remoteAddress ?? "unknown";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + config.rateLimitWindowMs });
    return next();
  }

  bucket.count += 1;
  if (bucket.count > config.rateLimitMax) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    return res
      .status(429)
      .json({ code: ERROR_CODES.RATE_LIMITED, message: ERROR_MESSAGES[ERROR_CODES.RATE_LIMITED] });
  }

  next();
};
