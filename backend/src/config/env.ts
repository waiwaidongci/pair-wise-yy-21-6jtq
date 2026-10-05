/**
 * 全局配置：由 .env / docker-compose 注入，新增配置必须同步
 * .env.example、docker-compose.yml 与本文件。
 */
export const config = {
  port: Number(process.env.PORT ?? 3000),
  db: {
    host: process.env.DB_HOST ?? "127.0.0.1",
    port: Number(process.env.DB_PORT ?? 3306),
    database: process.env.DB_NAME ?? "app_db",
    user: process.env.DB_USER ?? "app_user",
    password: process.env.DB_PASSWORD ?? "app_password",
    /** 测试环境可注入 GRID_REPAIR_DB_DRIVER=memory 关闭真实数据库连接 */
    driver: (process.env.DB_DRIVER ?? "mysql") as "mysql" | "memory"
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? "local-dev-secret"
  },
  restore: {
    /** 事务冲突（死锁/锁等待）后从最近确认状态重试的最大次数 */
    maxTxRetries: Number(process.env.RESTORE_TX_MAX_RETRIES ?? 5),
    lockWaitTimeoutMs: Number(process.env.RESTORE_LOCK_WAIT_MS ?? 5000)
  }
};
