import express from "express";
import cors from "cors";
import { config } from "./config/env";
import { authMiddleware } from "./middlewares/authMiddleware";
import { auditLogMiddleware } from "./middlewares/auditLogMiddleware";
import { requestLoggerMiddleware } from "./middlewares/requestLoggerMiddleware";
import { rateLimitMiddleware } from "./middlewares/rateLimitMiddleware";
import { errorHandlerMiddleware } from "./middlewares/errorHandlerMiddleware";
import gridAssetRoutes from "./routes/GridAssetRoutes";
import faultReportRoutes from "./routes/FaultReportRoutes";
import repairTicketRoutes from "./routes/RepairTicketRoutes";
import crewRoutes from "./routes/CrewRoutes";
import sparePartUsageRoutes from "./routes/SparePartUsageRoutes";
import { bootstrap } from "./bootstrap";
import { repositories } from "./repositories";

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);
app.get("/health", async (_req, res) => {
  try {
    await repositories.db.ping();
    res.json({ status: "ok", service: "grid-repair", datasource: config.db.driver });
  } catch (err) {
    res.status(503).json({ status: "down", message: (err as Error).message });
  }
});
app.use(authMiddleware);
app.use(auditLogMiddleware);

app.use("/api/grid-asset", gridAssetRoutes);
app.use("/api/fault-report", faultReportRoutes);
app.use("/api/repair-ticket", repairTicketRoutes);
app.use("/api/crew", crewRoutes);
app.use("/api/spare-part-usage", sparePartUsageRoutes);

app.use(errorHandlerMiddleware);

const server = app.listen(config.port, async () => {
  console.log(`grid-repair backend listening on ${config.port}`);
  try {
    await bootstrap();
  } catch (err) {
    console.error("[bootstrap-failed]", err);
  }
});

const shutdown = async () => {
  server.close(() => process.exit(0));
  await repositories.db.close().catch(() => undefined);
};
process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export { app };
