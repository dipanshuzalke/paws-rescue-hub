import { ApiError } from "../utils/apiError.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { User } from "../models/User.js";
import { notifyUsers, notifyRole } from "./notificationService.js";
import { transitionReport, populateReport } from "./rescueService.js";
import { MIN_EVIDENCE_IMAGES } from "../utils/constants.js";

/** Statuses from which a rescuer may submit (or resubmit) rescue evidence. */
const SUBMITTABLE_STATUSES = ["IN_PROGRESS", "RESCUED"];

function auditEvent({ report, user, action, note, previousStatus }) {
  return RescueHistory.create({
    report: report._id,
    changedBy: user._id,
    changedByName: user.name,
    changedByRole: user.role,
    action,
    previousStatus: previousStatus || report.status,
    newStatus: report.status,
    note,
  });
}

/**
 * Rescuer submits (or resubmits) rescue evidence.
 * The report moves IN_PROGRESS -> RESCUED and the evidence enters PENDING review.
 */
export async function submitEvidence({ report, user, photos = [], payload = {} }) {
  if (String(report.assignedRescuer) !== String(user._id)) {
    throw ApiError.forbidden("Only the assigned rescuer can submit evidence for this rescue");
  }
  if (!SUBMITTABLE_STATUSES.includes(report.status)) {
    throw ApiError.conflict(`Evidence can only be submitted while a rescue is in progress (current: ${report.status})`);
  }

  const evidence = report.rescueEvidence || {};
  const isResubmission = evidence.verificationStatus === "REJECTED";

  if (evidence.verificationStatus === "PENDING") {
    throw ApiError.conflict("Evidence for this rescue is already awaiting verification");
  }
  if (evidence.verificationStatus === "VERIFIED") {
    throw ApiError.conflict("This rescue has already been verified");
  }
  if (photos.length < MIN_EVIDENCE_IMAGES) {
    throw ApiError.badRequest(`At least ${MIN_EVIDENCE_IMAGES} rescue photo is required`);
  }

  const now = new Date();
  report.rescueEvidence.photos = photos;
  report.rescueEvidence.notes = payload.notes || "";
  report.rescueEvidence.animalCondition = payload.animalCondition || "";
  report.rescueEvidence.treatmentNotes = payload.treatmentNotes || "";
  if (typeof payload.latitude === "number" && typeof payload.longitude === "number") {
    report.rescueEvidence.completionLocation = {
      type: "Point",
      coordinates: [payload.longitude, payload.latitude],
    };
  }
  report.rescueEvidence.submittedBy = user._id;
  report.rescueEvidence.submittedAt = now;
  report.rescueEvidence.submissionCount = (evidence.submissionCount || 0) + 1;
  report.rescueEvidence.verificationStatus = "PENDING";
  report.rescueEvidence.rejectionReason = "";
  report.rescueEvidence.events.push({
    action: isResubmission ? "RESCUE_EVIDENCE_RESUBMITTED" : "RESCUE_EVIDENCE_SUBMITTED",
    by: user._id,
    byName: user.name,
    byRole: user.role,
    notes: payload.notes || "",
    photos,
    at: now,
  });

  // Mirror evidence photos onto the existing rescueImages gallery for the UI.
  report.rescueImages.push(...photos);

  const previousStatus = report.status;
  await report.save();

  await auditEvent({
    report,
    user,
    action: isResubmission ? "RESCUE_EVIDENCE_RESUBMITTED" : "RESCUE_EVIDENCE_SUBMITTED",
    note: isResubmission ? "Revised rescue evidence submitted" : "Rescue evidence submitted for verification",
    previousStatus,
  });

  let result = report;
  if (report.status === "IN_PROGRESS") {
    result = await transitionReport({
      report,
      newStatus: "RESCUED",
      user,
      note: "Rescue completed — evidence submitted for verification",
    });
  }

  await notifyRole(["NGO", "ADMIN"], {
    report: report._id,
    type: "EVIDENCE_SUBMITTED",
    title: `Evidence awaiting verification — ${report.reportId}`,
    message: `${user.name} submitted rescue evidence for verification.`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });

  return populateReport(result._id || report._id);
}

/** NGO / Admin approves the submitted evidence and closes the case. */
export async function verifyEvidence({ report, user, notes = "", rescuerRating, close = true }) {
  if (report.rescueEvidence?.verificationStatus !== "PENDING") {
    throw ApiError.conflict("There is no evidence awaiting verification on this rescue");
  }

  const now = new Date();
  report.rescueEvidence.verificationStatus = "VERIFIED";
  report.rescueEvidence.verifiedBy = user._id;
  report.rescueEvidence.verifiedAt = now;
  report.rescueEvidence.verificationNotes = notes;
  if (rescuerRating !== undefined && report.assignedRescuer) {
    const rescuer = await User.findById(report.assignedRescuer);
    if (rescuer) {
      const previousRatings = rescuer.ratedResponses || 0;
      rescuer.rating = previousRatings
        ? ((rescuer.rating || 0) * previousRatings + rescuerRating) / (previousRatings + 1)
        : rescuerRating;
      rescuer.ratedResponses = previousRatings + 1;
      await rescuer.save();
      report.rescueEvidence.rescuerRating = rescuerRating;
      report.rescueEvidence.rescuerRatedBy = user._id;
      report.rescueEvidence.rescuerRatedAt = now;
    }
  }
  report.rescueEvidence.events.push({
    action: "RESCUE_EVIDENCE_VERIFIED",
    by: user._id,
    byName: user.name,
    byRole: user.role,
    notes,
    at: now,
  });
  await report.save();

  await auditEvent({
    report,
    user,
    action: "RESCUE_EVIDENCE_VERIFIED",
    note: notes || "Rescue evidence verified",
  });

  let result = report;
  if (close && report.status === "RESCUED") {
    result = await transitionReport({
      report,
      newStatus: "CLOSED",
      user,
      note: "Rescue verified and case closed",
    });
  }

  await notifyUsers([report.rescueEvidence.submittedBy, report.assignedRescuer], {
    report: report._id,
    type: "EVIDENCE_VERIFIED",
    title: "Your rescue evidence has been verified",
    message: `Case ${report.reportId} has been verified${notes ? `: ${notes}` : ""}.`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });
  await notifyUsers([report.reporter], {
    report: report._id,
    type: "RESCUE_COMPLETED",
    title: "Rescue successfully verified and completed",
    message: `Your reported case ${report.reportId} has been verified and completed.`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });

  return populateReport(result._id || report._id);
}

/** NGO / Admin rejects the submitted evidence; the rescuer must revise it. */
export async function rejectEvidence({ report, user, reason }) {
  if (report.rescueEvidence?.verificationStatus !== "PENDING") {
    throw ApiError.conflict("There is no evidence awaiting verification on this rescue");
  }
  if (!reason || !reason.trim()) {
    throw ApiError.badRequest("A rejection reason is required");
  }

  const now = new Date();
  report.rescueEvidence.verificationStatus = "REJECTED";
  report.rescueEvidence.verifiedBy = user._id;
  report.rescueEvidence.verifiedAt = now;
  report.rescueEvidence.rejectionReason = reason.trim();
  report.rescueEvidence.events.push({
    action: "RESCUE_EVIDENCE_REJECTED",
    by: user._id,
    byName: user.name,
    byRole: user.role,
    notes: reason.trim(),
    at: now,
  });
  await report.save();

  await auditEvent({ report, user, action: "RESCUE_EVIDENCE_REJECTED", note: reason.trim() });

  await notifyUsers([report.rescueEvidence.submittedBy, report.assignedRescuer], {
    report: report._id,
    type: "EVIDENCE_REJECTED",
    title: "Your rescue evidence requires revision",
    message: reason.trim(),
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  });

  return populateReport(report._id);
}
