import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getOverview,
  getReportsByAnimal,
  getReportsByStatus,
  getReportsByPriority,
  getMonthly,
  getPerformance,
} from "../controllers/analyticsController.js";

const router = Router();

router.use(authenticateUser);

router.get("/overview", getOverview);
router.get("/reports-by-animal", getReportsByAnimal);
router.get("/reports-by-status", getReportsByStatus);
router.get("/reports-by-priority", getReportsByPriority);
router.get("/monthly", getMonthly);
router.get("/performance", getPerformance);

export default router;
