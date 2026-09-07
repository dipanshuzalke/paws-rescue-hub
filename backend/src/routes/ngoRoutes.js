import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles, requireVerifiedNgo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { assignmentSchema, updateOrganizationProfileSchema } from "../utils/validators.js";
import {
  getStats,
  getReports,
  getActiveRescues,
  getRescuers,
  getHistory,
  getAnalytics,
  getProfile,
  updateProfile,
  createAssignment,
  getAssignments,
} from "../controllers/ngoController.js";

const router = Router();

router.use(authenticateUser, authorizeRoles("NGO", "ADMIN"));

// Pending NGOs may only access their own profile while awaiting admin approval.
router.get("/profile", getProfile);
router.put("/profile", validate(updateOrganizationProfileSchema), updateProfile);
router.use(requireVerifiedNgo);

router.get("/stats", getStats);
router.get("/reports", getReports);
router.get("/active-rescues", getActiveRescues);
router.get("/rescuers", getRescuers);
router.get("/history", getHistory);
router.get("/analytics", getAnalytics);
router.post("/assignments", validate(assignmentSchema), createAssignment);
router.get("/assignments", getAssignments);

export default router;
