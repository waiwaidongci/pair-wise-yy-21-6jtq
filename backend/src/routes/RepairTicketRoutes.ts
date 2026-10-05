import { Router } from "express";
import { repairTicketController } from "../controllers/RepairTicketController";
import { rbacMiddleware } from "../middlewares/rbacMiddleware";

const router = Router();

router.get("/", repairTicketController.list);
router.get("/:id", repairTicketController.get);
router.post("/", rbacMiddleware(["dispatcher", "admin"]), repairTicketController.create);
router.post(
  "/:id/restore",
  rbacMiddleware(["dispatcher", "admin"]),
  repairTicketController.restore
);

export default router;
