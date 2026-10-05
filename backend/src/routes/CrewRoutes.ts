import { Router } from "express";
import { crewController } from "../controllers/CrewController";

const router = Router();

router.get("/", crewController.list);
router.get("/:id", crewController.get);
router.post("/", crewController.create);

export default router;
