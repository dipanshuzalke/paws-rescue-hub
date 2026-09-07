import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import { authorizeRoles, requireVerifiedNgo } from "../middleware/roleMiddleware.js";
import { validate } from "../middleware/validate.js";
import { uploadImages } from "../middleware/uploadMiddleware.js";
import {
  reportQuerySchema,
  statusUpdateSchema,
  noteSchema,
  evidenceSubmitSchema,
  evidenceVerifySchema,
  evidenceRejectSchema,
} from "../utils/validators.js";
import { MAX_EVIDENCE_IMAGES } from "../utils/constants.js";
import {
  postEvidence,
  pendingVerification,
  getEvidence,
  approveEvidence,
  denyEvidence,
} from "../controllers/evidenceController.js";
import {
  availableRescues,
  activeRescues,
  rescueHistoryList,
  rescuerStats,
  myActive,
  myHistory,
  setAvailability,
  acceptRescue,
  updateRescueStatus,
  addRescueNote,
  uploadRescueProof,
  getRescueDetail,
} from "../controllers/rescueController.js";

const router = Router();

router.use(authenticateUser);

// Literal paths first so they are not swallowed by `/:id`.
router.get("/available", authorizeRoles("RESCUER"), validate(reportQuerySchema, "query"), availableRescues);
router.get("/active", authorizeRoles("RESCUER"), validate(reportQuerySchema, "query"), activeRescues);
router.get("/history", authorizeRoles("RESCUER"), validate(reportQuerySchema, "query"), rescueHistoryList);
router.get("/rescuer-stats", authorizeRoles("RESCUER"), rescuerStats);
router.get("/my-active", authorizeRoles("CITIZEN"), validate(reportQuerySchema, "query"), myActive);
router.get("/my-history", authorizeRoles("CITIZEN"), validate(reportQuerySchema, "query"), myHistory);
router.get(
  "/pending-verification",
  authorizeRoles("NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(reportQuerySchema, "query"),
  pendingVerification,
);
router.patch("/availability", authorizeRoles("RESCUER"), setAvailability);

router.post("/:reportId/accept", authorizeRoles("RESCUER"), acceptRescue);
router.put("/:reportId/status", authorizeRoles("RESCUER", "ADMIN"), validate(statusUpdateSchema), updateRescueStatus);
router.post("/:reportId/notes", authorizeRoles("RESCUER", "NGO", "ADMIN"), validate(noteSchema), addRescueNote);
router.post(
  "/:reportId/proof",
  authorizeRoles("RESCUER"),
  uploadImages("images"),
  uploadRescueProof,
);

// --- Phase 3: rescue evidence & verification ----------------------------
router.post(
  "/:reportId/evidence",
  authorizeRoles("RESCUER"),
  uploadImages("photos", MAX_EVIDENCE_IMAGES),
  validate(evidenceSubmitSchema),
  postEvidence,
);
router.get("/:reportId/evidence", requireVerifiedNgo, getEvidence);
router.post(
  "/:reportId/evidence/verify",
  authorizeRoles("NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(evidenceVerifySchema),
  approveEvidence,
);
router.post(
  "/:reportId/evidence/reject",
  authorizeRoles("NGO", "ADMIN"),
  requireVerifiedNgo,
  validate(evidenceRejectSchema),
  denyEvidence,
);

router.get("/:id", authorizeRoles("RESCUER", "NGO", "ADMIN"), requireVerifiedNgo, getRescueDetail);

export default router;
