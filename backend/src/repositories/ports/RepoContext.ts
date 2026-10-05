import type { Tx } from "./Database";
import type { MemoryView } from "../memory/MemoryStore";

/**
 * 仓储执行上下文：
 * - MySQL 实现使用 client（事务连接）
 * - 内存实现使用 __memory（同一事务内的工作视图）
 */
export interface Ctx {
  client: Tx;
  __memory?: MemoryView;
}

export const asMemory = (ctx: Ctx): MemoryView => {
  if (!ctx.__memory) throw new Error("当前数据源不是内存库，无法访问内存视图");
  return ctx.__memory;
};
