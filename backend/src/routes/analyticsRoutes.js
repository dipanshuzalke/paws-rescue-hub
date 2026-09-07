import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requireVerifiedNgo } from "../middleware/roleMiddleware.js";
import {
  getOverview,
  getReportsByAnimal,
  getReportsByStatus,
  getReportsByPriority,
  getMonthly,
  getPerformance,
  getResponseTimeTrend,
} from "../controllers/analyticsController.js";

const router = Router();

router.use(authenticateUser);
router.use(requireVerifiedNgo);

router.get("/overview", getOverview);
router.get("/reports-by-animal", getReportsByAnimal);
router.get("/reports-by-status", getReportsByStatus);
router.get("/reports-by-priority", getReportsByPriority);
router.get("/monthly", getMonthly);
router.get("/performance", getPerformance);
router.get("/response-time-trend", getResponseTimeTrend);

export default router;
