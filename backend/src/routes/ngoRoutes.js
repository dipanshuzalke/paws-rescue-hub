import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { assignmentSchema } from "../utils/validators.js";
import {
  getStats,
  getReports,
  getActiveRescues,
  getRescuers,
  getHistory,
  getAnalytics,
  createAssignment,
  getAssignments,
} from "../controllers/ngoController.js";

const router = Router();

router.use(authenticateUser, authorizeRoles("NGO", "ADMIN"));

router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/active-rescues", getActiveRescues);
router.get("/rescuers", getRescuers);
router.get("/history", getHistory);
router.get("/analytics", getAnalytics);

router.post("/assignments", validate(assignmentSchema), createAssignment);
router.get("/assignments", getAssignments);

export default router;
