import { RescueReport } from "../models/RescueReport.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, created, list } from "../utils/apiResponse.js";
import { persistUploads } from "../middleware/uploadMiddleware.js";
import { buildReportFilter, paginateReports, recordHistory } from "../services/reportService.js";
import { notifyRole } from "../services/notificationService.js";

const POPULATE_USER_FIELDS = "name email phone role avatar profileImage organization availability";
const SAFE_REPORTER_FIELDS = "name email phone avatar profileImage";

function canViewReport(user, report) {
  if (user.role === "ADMIN" || user.role === "NGO") return true;
  if (String(report.reporter?._id || report.reporter) === String(user._id)) return true;
  if (report.assignedRescuer && String(report.assignedRescuer?._id || report.assignedRescuer) === String(user._id)) {
    return true;
  }
  return false;
}

/** GET /api/reports — operational list for NGO/ADMIN/RESCUER */
export const listReports = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query);
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "reporter", select: POPULATE_USER_FIELDS },
    { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
    { path: "assignedOrganization" },
  ]);
  return list(res, items, pagination);
});

/** POST /api/reports — CITIZEN creates a new report */
export const createReport = asyncHandler(async (req, res) => {
  const body = req.body;
  const images = await persistUploads(req.files || [], "resqpaws/reports");

  const report = await RescueReport.create({
    reporter: req.user._id,
    title: body.title || "",
    animalType: body.animalType,
    animalCount: body.animalCount,
    condition: body.condition,
    emergencyLevel: body.emergencyLevel,
    description: body.description || "",
    contactPhone: body.contactPhone,
    images,
    location: { type: "Point", coordinates: [body.longitude, body.latitude] },
    address: body.address,
    area: body.area,
    city: body.city,
    duplicateWarningShown: Boolean(body.duplicateWarningShown),
    duplicateOverride: Boolean(body.duplicateOverride),
  });

  await recordHistory({ report, user: req.user, previousStatus: "NONE", newStatus: "REPORTED", note: "Report created" });

  // A newly reported case is also visible in the rescuer's available queue,
  // so alert active rescuers immediately instead of waiting for an NGO to
  // manually assign the case.
  await notifyRole(["NGO", "ADMIN", "RESCUER"], {
    report: report._id,
    type: "NEW_REPORT",
    title: `New ${report.emergencyLevel} priority report`,
    message: `${report.animalType} reported ${report.condition.toLowerCase()} at ${report.address}`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });

  const populated = await report.populate([{ path: "reporter", select: SAFE_REPORTER_FIELDS }]);

  return created(res, populated, "Report submitted successfully");
});

/** GET /api/reports/my-reports — citizen's own reports */
export const myReports = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, { reporter: req.user._id });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
    { path: "assignedOrganization" },
  ]);
  return list(res, items, pagination);
});

/** GET /api/reports/my-stats */
export const myStats = asyncHandler(async (req, res) => {
  const reporter = req.user._id;
  const [totalReports, pendingReports, activeRescues, rescuedCases] = await Promise.all([
    RescueReport.countDocuments({ reporter }),
    RescueReport.countDocuments({ reporter, status: "REPORTED" }),
    RescueReport.countDocuments({ reporter, status: { $in: ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"] } }),
    RescueReport.countDocuments({ reporter, status: { $in: ["RESCUED", "CLOSED"] } }),
  ]);
  return ok(res, { totalReports, pendingReports, activeRescues, rescuedCases });
});

/** GET /api/reports/status/:status */
export const reportsByStatus = asyncHandler(async (req, res) => {
  const { status } = req.params;
  const filter = buildReportFilter(req.validatedQuery || req.query, { status });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "reporter", select: POPULATE_USER_FIELDS },
    { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** GET /api/reports/:id */
export const getReport = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.id)
    .populate("reporter", SAFE_REPORTER_FIELDS)
    .populate("assignedRescuer", POPULATE_USER_FIELDS)
    .populate("assignedOrganization");

  if (!report) throw ApiError.notFound("Report not found");

  if (!canViewReport(req.user, report)) {
    throw ApiError.forbidden("You do not have permission to view this report");
  }

  const history = await RescueHistory.find({ report: report._id }).sort({ timestamp: 1 });

  const payload = report.toObject();
  // Only the owner, assigned rescuer, NGO or ADMIN reach this point already (canViewReport above),
  // but still hide reporter contact info from a rescuer not yet assigned.
  if (req.user.role === "RESCUER" && String(report.assignedRescuer?._id || "") !== String(req.user._id)) {
    if (payload.reporter) {
      delete payload.reporter.phone;
      delete payload.reporter.email;
    }
  }

  return ok(res, { ...payload, history });
});

/** PUT /api/reports/:id — owner only, only while REPORTED */
export const updateReport = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");

  if (String(report.reporter) !== String(req.user._id)) {
    throw ApiError.forbidden("You can only edit your own reports");
  }
  if (report.status !== "REPORTED") {
    throw ApiError.conflict("This report can no longer be edited");
  }

  const allowed = [
    "animalType",
    "animalCount",
    "condition",
    "emergencyLevel",
    "description",
    "address",
    "area",
    "city",
    "title",
  ];
  for (const key of allowed) {
    if (req.body[key] !== undefined) report[key] = req.body[key];
  }
  if (req.body.latitude !== undefined && req.body.longitude !== undefined) {
    report.location = { type: "Point", coordinates: [req.body.longitude, req.body.latitude] };
  }

  await report.save();
  return ok(res, report, "Report updated successfully");
});

/** POST /api/reports/:id/cancel — owner or admin, only before IN_PROGRESS */
export const cancelReport = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");

  const isOwner = String(report.reporter) === String(req.user._id);
  if (!isOwner && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("You do not have permission to cancel this report");
  }
  if (["IN_PROGRESS", "RESCUED", "CLOSED", "CANCELLED"].includes(report.status)) {
    throw ApiError.conflict(`Cannot cancel a report that is already ${report.status}`);
  }

  const previousStatus = report.status;
  report.status = "CANCELLED";
  report.cancelledReason = req.body?.reason || "Cancelled by user";
  report.closedAt = new Date();
  await report.save();

  await recordHistory({ report, user: req.user, previousStatus, newStatus: "CANCELLED", note: report.cancelledReason });

  return ok(res, report, "Report cancelled");
});

/** DELETE /api/reports/:id — ADMIN only */
export const deleteReport = asyncHandler(async (req, res) => {
  const report = await RescueReport.findByIdAndDelete(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");
  await RescueHistory.deleteMany({ report: report._id });
  return ok(res, null, "Report deleted successfully");
});

export const addReportNote = asyncHandler(async (req, res) => {
  const { text } = req.body;

  if (!text?.trim()) {
    throw new ApiError(400, "Note cannot be empty");
  }

  const report = await RescueReport.findById(req.params.id);

  if (!report) {
    throw new ApiError(404, "Rescue report not found");
  }

  // Citizen can only add notes to their own report
  if (
    req.user.role === "CITIZEN" &&
    String(report.reporter) !== String(req.user._id)
  ) {
    throw new ApiError(
      403,
      "You can only add notes to your own report"
    );
  }

  report.rescueNotes.push({
    author: req.user._id,
    authorName: req.user.name,
    authorRole: req.user.role,
    text: text.trim(),
    at: new Date(),
  });

  await report.save();

  const updatedReport = await RescueReport.findById(report._id)
    .populate("reporter", "name email phone")
    .populate("assignedRescuer", "name email phone")
    .populate("assignedOrganization", "name");

  return res.status(200).json({
    success: true,
    data: updatedReport,
  });
});