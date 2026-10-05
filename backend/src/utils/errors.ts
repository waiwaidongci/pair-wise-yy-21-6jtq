import { ERROR_CODES, type ErrorCode } from "../constants/errorCodes";
import { renderErrorMessage } from "../constants/errorMessages";
import type { TemplateParams } from "./errorParams";

export class DomainError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly params: TemplateParams;

  constructor(code: ErrorCode, params: TemplateParams = {}, status = 400) {
    super(renderErrorMessage(code as keyof typeof ERROR_CODES, params));
    this.name = "DomainError";
    this.code = code;
    this.status = status;
    this.params = params;
  }
}

export const notFound = (code: ErrorCode, params: TemplateParams = {}) =>
  new DomainError(code, params, 404);

export const conflict = (code: ErrorCode, params: TemplateParams = {}) =>
  new DomainError(code, params, 409);

export const badRequest = (code: ErrorCode, params: TemplateParams = {}) =>
  new DomainError(code, params, 400);
