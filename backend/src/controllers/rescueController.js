import { RescueReport } from "../models/RescueReport.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, list } from "../utils/apiResponse.js";
import { persistUploads } from "../middleware/uploadMiddleware.js";
import { buildReportFilter, paginateReports, recordHistory } from "../services/reportService.js";
import { transitionReport, populateReport } from "../services/rescueService.js";
import { notifyUsers } from "../services/notificationService.js";

const POPULATE_USER_FIELDS = "name email phone role avatar profileImage organization availability";
const SAFE_REPORTER_FIELDS = "name email phone avatar profileImage";

/** GET /api/rescues/available — reported cases, or ones already assigned to this rescuer */
export const availableRescues = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, {
    $or: [{ status: "REPORTED" }, { status: "ASSIGNED", assignedRescuer: req.user._id }],
  });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "reporter", select: SAFE_REPORTER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** GET /api/rescues/active — this rescuer's ACCEPTED/IN_PROGRESS cases */
export const activeRescues = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, {
    assignedRescuer: req.user._id,
    status: { $in: ["ACCEPTED", "IN_PROGRESS"] },
  });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "reporter", select: SAFE_REPORTER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** GET /api/rescues/history — this rescuer's completed/cancelled cases */
export const rescueHistoryList = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, {
    assignedRescuer: req.user._id,
    status: { $in: ["RESCUED", "CLOSED", "CANCELLED"] },
  });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "reporter", select: SAFE_REPORTER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** GET /api/rescues/rescuer-stats */
export const rescuerStats = asyncHandler(async (req, res) => {
  const rescuerId = req.user._id;
  const [availableRequests, activeCases, completedCases, criticalCases, responseRows] = await Promise.all([
    RescueReport.countDocuments({ status: "REPORTED" }),
    RescueReport.countDocuments({ assignedRescuer: rescuerId, status: { $in: ["ACCEPTED", "IN_PROGRESS"] } }),
    RescueReport.countDocuments({ assignedRescuer: rescuerId, status: { $in: ["RESCUED", "CLOSED"] } }),
    RescueReport.countDocuments({ status: { $in: ["REPORTED", "ASSIGNED"] }, emergencyLevel: "CRITICAL" }),
    RescueReport.aggregate([
      { $match: { assignedRescuer: rescuerId, reportedAt: { $ne: null }, assignedAt: { $ne: null } } },
      {
        $group: {
          _id: null,
          average: { $avg: { $divide: [{ $subtract: ["$assignedAt", "$reportedAt"] }, 60000] } },
        },
      },
    ]),
  ]);
  return ok(res, {
    availableRequests,
    activeRescues: activeCases,
    completedRescues: completedCases,
    criticalCases,
    avgResponseMins: Math.round(responseRows[0]?.average || 0),
    rating: req.user.ratedResponses > 0 ? req.user.rating : 0,
    ratedResponses: req.user.ratedResponses || 0,
  });
});

/** GET /api/rescues/my-active — CITIZEN's active reports */
export const myActive = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, {
    reporter: req.user._id,
    status: { $in: ["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS"] },
  });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** GET /api/rescues/my-history — CITIZEN's closed reports */
export const myHistory = asyncHandler(async (req, res) => {
  const filter = buildReportFilter(req.validatedQuery || req.query, {
    reporter: req.user._id,
    status: { $in: ["RESCUED", "CLOSED", "CANCELLED"] },
  });
  const { items, pagination } = await paginateReports(filter, req.validatedQuery || req.query, [
    { path: "assignedRescuer", select: POPULATE_USER_FIELDS },
  ]);
  return list(res, items, pagination);
});

/** PATCH /api/rescues/availability */
export const setAvailability = asyncHandler(async (req, res) => {
  const { availability } = req.body;
  if (!["AVAILABLE", "BUSY", "OFFLINE"].includes(availability)) {
    throw ApiError.badRequest("availability must be AVAILABLE, BUSY or OFFLINE");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    { availability, lastSeenAt: new Date() },
    { new: true, runValidators: true },
  );
  return ok(res, { user }, "Availability updated");
});

/** POST /api/rescues/:reportId/accept */
export const acceptRescue = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  if (report.assignedRescuer && String(report.assignedRescuer) !== String(req.user._id)) {
    throw ApiError.conflict("This report has already been assigned to another rescuer");
  }
  if (!["REPORTED", "ASSIGNED"].includes(report.status)) {
    throw ApiError.conflict(`Cannot accept a report that is ${report.status}`);
  }

  let assignment = null;
  if (report.assignment) {
    assignment = await RescueAssignment.findById(report.assignment);
  }
  if (!assignment) {
    assignment = await RescueAssignment.create({
      report: report._id,
      rescuer: req.user._id,
      assignedBy: req.user._id,
      status: "ASSIGNED",
    });
    report.assignment = assignment._id;
  }
  report.assignedRescuer = req.user._id;

  if (report.status === "REPORTED") {
    report.status = "ASSIGNED";
    report.assignedAt = new Date();
    await report.save();
    await recordHistory({ report, user: req.user, previousStatus: "REPORTED", newStatus: "ASSIGNED", note: "Rescuer self-assigned" });
  } else {
    await report.save();
  }

  const updated = await transitionReport({ report, newStatus: "ACCEPTED", user: req.user, note: "Rescuer accepted the case" });

  await notifyUsers([report.reporter], {
    report: report._id,
    type: "RESCUE_ACCEPTED",
    title: "A rescuer has accepted your report",
    message: `${req.user.name} is on the way to help`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });

  return ok(res, updated, "Rescue accepted");
});

/** PUT /api/rescues/:reportId/status */
export const updateRescueStatus = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  if (String(report.assignedRescuer) !== String(req.user._id) && req.user.role !== "ADMIN") {
    throw ApiError.forbidden("Only the assigned rescuer can update this report's status");
  }

  const { status, note } = req.body;

  // Phase 3 guard: completion and closure must go through the evidence workflow.
  const evidenceStatus = report.rescueEvidence?.verificationStatus || "NONE";
  if (status === "RESCUED" && req.user.role === "RESCUER") {
    throw ApiError.badRequest(
      "Submit rescue evidence to complete this rescue — it will then await verification",
    );
  }
  if (status === "CLOSED" && evidenceStatus !== "VERIFIED") {
    throw ApiError.conflict("This case can only be closed after its rescue evidence is verified");
  }

  const updated = await transitionReport({ report, newStatus: status, user: req.user, note });
  return ok(res, updated, "Status updated");
});

/** POST /api/rescues/:reportId/notes */
export const addRescueNote = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  if (String(report.assignedRescuer) !== String(req.user._id) && !["NGO", "ADMIN"].includes(req.user.role)) {
    throw ApiError.forbidden("You are not authorized to add notes to this report");
  }

  report.rescueNotes.push({
    author: req.user._id,
    authorName: req.user.name,
    authorRole: req.user.role,
    text: req.body.text,
  });
  await report.save();

  return ok(res, report, "Note added");
});

/** POST /api/rescues/:reportId/proof */
export const uploadRescueProof = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.reportId);
  if (!report) throw ApiError.notFound("Report not found");

  if (String(report.assignedRescuer) !== String(req.user._id)) {
    throw ApiError.forbidden("Only the assigned rescuer can upload proof images");
  }

  const images = await persistUploads(req.files || [], "resqpaws/rescue-proof");
  report.rescueImages.push(...images);
  await report.save();

  return ok(res, report, "Proof images uploaded");
});

/** GET /api/rescues/:id — case detail for assigned rescuer / NGO / ADMIN */
export const getRescueDetail = asyncHandler(async (req, res) => {
  const report = await populateReport(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");

  const isAssigned = report.assignedRescuer && String(report.assignedRescuer._id) === String(req.user._id);
  if (!isAssigned && !["NGO", "ADMIN"].includes(req.user.role)) {
    throw ApiError.forbidden("You do not have permission to view this case");
  }

  return ok(res, report);
});
