import mongoose from "mongoose";
import { RescueReport } from "../models/RescueReport.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok } from "../utils/apiResponse.js";
import { recordHistory } from "../services/reportService.js";
import { findDuplicateCandidates, findDuplicatesForReport } from "../services/duplicateService.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { notifyUsers } from "../services/notificationService.js";

/** POST /api/reports/check-duplicates — citizen pre-submission check */
export const checkDuplicates = asyncHandler(async (req, res) => {
  const { animalType, latitude, longitude, condition, radiusMeters, windowHours } = req.body;
  const result = await findDuplicateCandidates({
    animalType,
    latitude,
    longitude,
    condition,
    radiusMeters,
    windowHours,
  });
  return ok(res, result);
});

/** GET /api/reports/:id/duplicates — NGO/Admin operational duplicate view */
export const reportDuplicates = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");

  const result = await findDuplicatesForReport(report, { minScore: 40 });
  return ok(res, result);
});

/** POST /api/reports/:id/mark-duplicate — link this report to a primary case */
export const markDuplicate = asyncHandler(async (req, res) => {
  const { primaryReportId, note = "" } = req.body;
  if (!mongoose.isValidObjectId(primaryReportId)) throw ApiError.badRequest("Invalid primary report id");

  const [report, primary] = await Promise.all([
    RescueReport.findById(req.params.id),
    RescueReport.findById(primaryReportId),
  ]);
  if (!report) throw ApiError.notFound("Report not found");
  if (!primary) throw ApiError.notFound("Primary report not found");
  if (String(report._id) === String(primary._id)) {
    throw ApiError.badRequest("A report cannot be a duplicate of itself");
  }
  if (primary.duplicateOf) {
    throw ApiError.conflict("The selected primary report is itself marked as a duplicate");
  }
  if (["CLOSED", "CANCELLED"].includes(report.status)) {
    throw ApiError.conflict(`Cannot mark a ${report.status} report as duplicate`);
  }

  report.duplicateOf = primary._id;
  report.duplicateResolvedBy = req.user._id;
  report.duplicateResolvedAt = new Date();
  report.duplicateResolutionNote = note;
  await report.save();

  await RescueHistory.create({
    report: report._id,
    changedBy: req.user._id,
    changedByName: req.user.name,
    changedByRole: req.user.role,
    action: "DUPLICATE_MARKED",
    previousStatus: report.status,
    newStatus: report.status,
    note: note || `Marked as duplicate of ${primary.reportId}`,
  });

  await notifyUsers([report.reporter], {
    report: primary._id,
    type: "DUPLICATE_FLAGGED",
    title: "Your report was linked to an existing case",
    message: `We are already handling this rescue under case ${primary.reportId}.`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${primary._id}`,
  });

  return ok(res, report, "Report marked as duplicate");
});

/** POST /api/reports/:id/keep-separate — dismiss the duplicate suggestion */
export const keepSeparate = asyncHandler(async (req, res) => {
  const report = await RescueReport.findById(req.params.id);
  if (!report) throw ApiError.notFound("Report not found");

  report.duplicateOf = null;
  report.duplicateResolvedBy = req.user._id;
  report.duplicateResolvedAt = new Date();
  report.duplicateResolutionNote = req.body?.note || "Confirmed as a separate case";
  await report.save();

  await RescueHistory.create({
    report: report._id,
    changedBy: req.user._id,
    changedByName: req.user.name,
    changedByRole: req.user.role,
    action: "DUPLICATE_DISMISSED",
    previousStatus: report.status,
    newStatus: report.status,
    note: report.duplicateResolutionNote,
  });

  return ok(res, report, "Report kept as a separate case");
});

export { recordHistory };
