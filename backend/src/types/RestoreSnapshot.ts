import type { RestoreOutcome, RestoreResponse } from "./RestoreOutcome";

/** restore_confirmation.result_snapshot 的固化内容（重启/重试后原样回放） */
export type RestoreSnapshot =
  | { kind: "RESTORED"; outcome: RestoreOutcome }
  | {
      kind: "CONFLICT";
      /** 先到者的处置结果（当前状态以它为准） */
      winnerOutcome: RestoreOutcome;
      conflict: NonNullable<RestoreResponse["conflict"]>;
    };

export const encodeSnapshot = (snapshot: RestoreSnapshot): string =>
  JSON.stringify(snapshot);

export const decodeSnapshot = (raw: string): RestoreSnapshot =>
  JSON.parse(raw) as RestoreSnapshot;

export const snapshotToResponse = (
  requestId: string,
  snapshot: RestoreSnapshot
): RestoreResponse => {
  if (snapshot.kind === "RESTORED") {
    return { kind: "RESTORED", requestId, outcome: snapshot.outcome, conflict: null };
  }
  return {
    kind: "CONFLICT",
    requestId,
    outcome: snapshot.winnerOutcome,
    conflict: snapshot.conflict
  };
};
