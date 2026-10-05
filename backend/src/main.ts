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
// Initializes the persistent file-backed store (loads or seeds on first boot).
import "./store";

const app = express();
app.use(cors());
app.use(express.json());
app.use(requestLoggerMiddleware);
app.use(rateLimitMiddleware);
// Health check is public so the container healthcheck can reach it without auth.
app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "grid-repair", store: "file-backed" })
);
app.use(authMiddleware);
app.use(auditLogMiddleware);
app.use("/api/grid-asset", gridAssetRoutes);
app.use("/api/fault-report", faultReportRoutes);
app.use("/api/repair-ticket", repairTicketRoutes);
app.use("/api/crew", crewRoutes);
app.use("/api/spare-part-usage", sparePartUsageRoutes);
app.use(errorHandlerMiddleware);
app.listen(config.port, () =>
  console.info(`grid-repair backend listening on port ${config.port} (data dir: ${config.dataDir})`)
);
