import { RescueReport } from "../models/RescueReport.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, list } from "../utils/apiResponse.js";
import { persistUploads } from "../middleware/uploadMiddleware.js";
import { paginateReports } from "../services/reportService.js";
import { submitEvidence, verifyEvidence, rejectEvidence } from "../services/evidenceService.js";
import { populateReport } from "../services/rescueService.js";

const POPULATE_USER_FIELDS = "name email phone role avatar profileImage organization availability";
const SAFE_REPORTER_FIELDS = "name email phone avatar profileImage";

/** POST /api/rescues/:reportId/evidence — assigned rescuer submits/resubmits evidence */
export const postEvidence = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  const photos = await persistUploads(req.files || [], "resqpaws/rescue-evidence");
  const body = req.body || {};

  const updated = await submitEvidence({
    report,
    user: req.user,
    photos,
    payload: {
      notes: body.notes,
      animalCondition: body.animalCondition,
      treatmentNotes: body.treatmentNotes,
      latitude: body.latitude === undefined ? undefined : Number(body.latitude),
      longitude: body.longitude === undefined ? undefined : Number(body.longitude),
    },
  });

  return ok(res, updated, "Rescue evidence submitted for verification");
});

/** GET /api/rescues/pending-verification — NGO/Admin verification queue */
export const pendingVerification = asyncHandler(async (req, res) => {
  const { items, pagination } = await paginateReports(
    { "rescueEvidence.verificationStatus": "PENDING" },
    { ...(req.validatedQuery || req.query), sortBy: "updatedAt", sortOrder: "desc" },
    [
      { path: "reporter", select: SAFE_REPORTER_FIELDS },
      { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
      { path: "assignedOrganization" },
    ],
  );
  return list(res, items, pagination);
});

/** GET /api/rescues/:reportId/evidence — evidence detail for review */
export const getEvidence = asyncHandler(async (req, res) => {
  const report = await populateReport(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  const isAssigned =
    report.assignedRescuer && String(report.assignedRescuer._id) === String(req.user._id);
  const isReporter = String(report.reporter?._id || report.reporter) === String(req.user._id);
  if (!isAssigned && !isReporter && !["NGO", "ADMIN"].includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to view this evidence");
  }

  return ok(res, report);
});

/** POST /api/rescues/:reportId/evidence/verify — NGO/Admin approves */
export const approveEvidence = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  const updated = await verifyEvidence({
    report,
    user: req.user,
    notes: req.body?.notes || "",
    close: req.body?.close !== false,
  });
  return ok(res, updated, "Rescue evidence verified");
});

/** POST /api/rescues/:reportId/evidence/reject — NGO/Admin rejects */
export const denyEvidence = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  const updated = await rejectEvidence({ report, user: req.user, reason: req.body?.reason });
  return ok(res, updated, "Rescue evidence rejected");
});
