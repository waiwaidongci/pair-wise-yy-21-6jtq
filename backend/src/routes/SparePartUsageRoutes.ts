import { Router } from "express";
import { sparePartUsageController } from "../controllers/SparePartUsageController";

const router = Router();

router.get("/", sparePartUsageController.list);
router.get("/:id", sparePartUsageController.get);
router.post("/", sparePartUsageController.create);

export default router;
