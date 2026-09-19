import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { requireAdmin } from "../middleware/roleMiddleware.js";
import {
  getStats,
  getUsers,
  getUserById,
  updateUser,
  updateUserStatus,
  getRescuers,
  getReports,
  getNgos,
  getNgoById,
  updateNgo,
  verifyNgo,
  rejectNgo,
  getActivity,
  getAnalytics,
  deleteUser,
} from "../controllers/adminController.js";

const router = Router();

router.use(authenticateUser, requireAdmin);

router.get("/stats", getStats);

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.put("/users/:id", updateUser);
router.patch("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

router.get("/rescuers", getRescuers);
router.get("/reports", getReports);

router.get("/ngos", getNgos);
router.get("/ngos/:id", getNgoById);
router.put("/ngos/:id", updateNgo);
router.patch("/ngos/:id/verify", verifyNgo);
router.patch("/ngos/:id/reject", rejectNgo);

router.get("/activity", getActivity);
router.get("/analytics", getAnalytics);

export default router;
