import type { Request, Response, NextFunction, RequestHandler } from "express";

/** 让 async 控制器抛出的异常进入 errorHandlerMiddleware，而不是变成 unhandledRejection */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };
