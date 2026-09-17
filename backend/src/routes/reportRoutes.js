import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles, requireVerifiedNgo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadImages } from "../middleware/uploadMiddleware.js";
import {
  createReportSchema,
  updateReportSchema,
  reportQuerySchema,
  checkDuplicatesSchema,
  markDuplicateSchema,
  keepSeparateSchema,
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
  addReportNote
} from "../controllers/reportController.js";
import {
  checkDuplicates,
  reportDuplicates,
  markDuplicate,
  keepSeparate,
} from "../controllers/duplicateController.js";

const router = Router();

router.use(authenticateUser);

router.get(
  "/",
  authorizeRoles("NGO", "ADMIN", "RESCUER"),
  requireVerifiedNgo,
  validate(reportQuerySchema, "query"),
  listReports,
);

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
  requireVerifiedNgo,
  validate(reportQuerySchema, "query"),
  reportsByStatus,
);

// --- Phase 3: duplicate detection ---------------------------------------
router.post(
  "/check-duplicates",
  authorizeRoles("CITIZEN", "NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(checkDuplicatesSchema),
  checkDuplicates,
);
router.get("/:id/duplicates", authorizeRoles("NGO", "ADMIN"), requireVerifiedNgo, reportDuplicates);
router.post(
  "/:id/mark-duplicate",
  authorizeRoles("NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(markDuplicateSchema),
  markDuplicate,
);
router.post(
  "/:id/keep-separate",
  authorizeRoles("NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(keepSeparateSchema),
  keepSeparate,
);

router.post(
  "/:id/notes",
  authorizeRoles("CITIZEN"),
  addReportNote,
);
router.get("/:id", requireVerifiedNgo, getReport);
router.put("/:id", authorizeRoles("CITIZEN"), validate(updateReportSchema), updateReport);
router.post("/:id/cancel", cancelReport);
router.delete("/:id", authorizeRoles("ADMIN"), deleteReport);

export default router;
