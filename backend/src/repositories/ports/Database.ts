/**
 * 持久层端口：Service 只依赖该接口，生产环境由 mysql2/InnoDB 实现，
 * 测试环境由内存适配器实现（同样的事务与唯一约束语义）。
 */
export type Row = Record<string, unknown>;

export interface Tx {
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface Database {
  /**
   * 在单个数据库事务中执行 work：
   * work 内所有查询共用同一连接/同一快照（SELECT ... FOR UPDATE 生效），
   * 抛错回滚，正常返回则提交。
   */
  transaction<T>(work: (tx: { client: Tx }) => Promise<T>): Promise<T>;
  /** 只读访问（列表、详情），自动提交 */
  read<T>(work: (tx: { client: Tx }) => Promise<T>): Promise<T>;
  /** 启动期幂等建表 */
  executeScript(sql: string): Promise<void>;
  ping(): Promise<void>;
  close(): Promise<void>;
}

/** mysql 死锁/锁等待错误（ER_LOCK_DEADLOCK=1213, ER_LOCK_WAIT_TIMEOUT=1205） */
export const isRetryableDbError = (err: unknown): boolean => {
  const errno = (err as { errno?: number })?.errno;
  return errno === 1213 || errno === 1205;
};
