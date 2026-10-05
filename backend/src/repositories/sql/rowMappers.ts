import type { Row } from "../ports/Database";

const toInt = (v: unknown): number | null => {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** MySQL DATETIME(3) 字符串 -> ISO；内存库本来就是 ISO */
export const toIso = (v: unknown): string | null => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v !== "string") return v as unknown as string;
  if (v.includes("T")) return v;
  return v.replace(" ", "T") + (v.length === 19 ? ".000Z" : "Z");
};

/** ISO -> MySQL DATETIME 字面量参数 */
export const toMysqlDateTime = (iso: string): string => iso.replace("T", " ").replace(/\.\d{3}Z$/, "").replace(/Z$/, "");

export const num = (v: unknown, fallback = 0): number => toInt(v) ?? fallback;
export const str = (v: unknown, fallback = ""): string => (v === null || v === undefined ? fallback : String(v));
export const nullableNum = (v: unknown): number | null => toInt(v);
export const isUniqueViolation = (err: unknown): boolean =>
  (err as { errno?: number })?.errno === 1062;

export type { Row };
