import mysql, { type Pool, type PoolConnection } from "mysql2/promise";
import { config } from "../config/env";
import type { Database, Row, Tx } from "./ports/Database";

class MysqlTx implements Tx {
  constructor(private readonly conn: PoolConnection) {}
  async query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
    const [rows] = await this.conn.query(sql, params);
    if (Array.isArray(rows)) return rows as T[];
    return rows as unknown as T[];
  }
}

export class MysqlDatabase implements Database {
  private pool: Pool | null = null;

  private ensurePool(): Pool {
    if (!this.pool) {
      this.pool = mysql.createPool({
        host: config.db.host,
        port: config.db.port,
        database: config.db.database,
        user: config.db.user,
        password: config.db.password,
        waitForConnections: true,
        connectionLimit: 10,
        maxIdle: 10,
        idleTimeout: 60_000,
        charset: "utf8mb4",
        dateStrings: true
      });
    }
    return this.pool;
  }

  async transaction<T>(work: (tx: { client: Tx }) => Promise<T>): Promise<T> {
    const conn = await this.ensurePool().getConnection();
    try {
      await conn.beginTransaction();
      await conn.query("SET SESSION innodb_lock_wait_timeout = ?", [
        Math.max(1, Math.floor(config.restore.lockWaitTimeoutMs / 1000))
      ]);
      const result = await work({ client: new MysqlTx(conn) });
      await conn.commit();
      return result;
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async read<T>(work: (tx: { client: Tx }) => Promise<T>): Promise<T> {
    const conn = await this.ensurePool().getConnection();
    try {
      return await work({ client: new MysqlTx(conn) });
    } finally {
      conn.release();
    }
  }

  async executeScript(sql: string): Promise<void> {
    const statements = sql
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));
    for (const statement of statements) {
      await this.ensurePool().query(statement);
    }
  }

  async ping(): Promise<void> {
    await this.ensurePool().query("SELECT 1 AS ok");
  }

  async close(): Promise<void> {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}
