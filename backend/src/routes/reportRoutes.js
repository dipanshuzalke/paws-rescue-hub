import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadImages } from "../middleware/uploadMiddleware.js";
import {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
} from "../utils/validators.js";
import {
  listReports,
  createReport,
  myReports,
  myStats,
  reportsByStatus,
  getReport,
  updateReport,
  cancelReport,
  deleteReport,
} from "../controllers/reportController.js";

const router = Router();

router.use(authenticateUser);

router.get("/", authorizeRoles("NGO", "ADMIN", "RESCUER"), validate(reportQuerySchema, "query"), listReports);

router.post(
  "/",
  authorizeRoles("CITIZEN"),
  uploadImages("images"),
  validate(createReportSchema),
  createReport,
);

router.get("/my-reports", authorizeRoles("CITIZEN"), validate(reportQuerySchema, "query"), myReports);
router.get("/my-stats", authorizeRoles("CITIZEN"), myStats);
router.get(
  "/status/:status",
  authorizeRoles("NGO", "ADMIN", "RESCUER"),
  validate(reportQuerySchema, "query"),
  reportsByStatus,
);

router.get("/:id", getReport);
router.put("/:id", authorizeRoles("CITIZEN"), validate(updateReportSchema), updateReport);
router.post("/:id/cancel", cancelReport);
router.delete("/:id", authorizeRoles("ADMIN"), deleteReport);

export default router;
