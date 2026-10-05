import { Router } from "express";
import { repairTicketController } from "../controllers/RepairTicketController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();

router.get("/", repairTicketController.list);
router.get("/:id", repairTicketController.detail);
router.post("/", rbacMiddleware(["DISPATCHER", "ADMIN"]), repairTicketController.create);
// 复电确认：调度员/班组长可执行；幂等键在 body.requestId
router.post(
  "/:id/restore",
  rbacMiddleware(["DISPATCHER", "LEADER", "ADMIN"]),
  repairTicketController.restore
);

export default router;
