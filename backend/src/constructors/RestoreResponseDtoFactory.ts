import type { RestoreResponse } from "../types/RestoreOutcome";

/** 复电响应占位（真实数据由 RestoreConfirmationService 产出） */
export const createRestoreResponseDto = (
  overrides: Partial<RestoreResponse> = {}
): Partial<RestoreResponse> => ({
  kind: "RESTORED",
  requestId: "",
  conflict: null,
  ...overrides
});
