import path from "path";

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: Number(process.env.DB_PORT ?? 3306),
  dbName: process.env.DB_NAME ?? "app_db",
  dbUser: process.env.DB_USER ?? "app_user",
  dbPassword: process.env.DB_PASSWORD ?? "app_password",
  jwtSecret: process.env.JWT_SECRET ?? "local-dev-secret",
  dataDir: process.env.DATA_DIR ?? path.join(process.cwd(), "data"),
  nodeEnv: process.env.NODE_ENV ?? "development",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 60_000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX ?? 120),
};
