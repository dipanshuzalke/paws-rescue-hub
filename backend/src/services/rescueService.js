import { ApiError } from "../utils/apiError.js";
import { canTransition, STATUS_TIMESTAMP_FIELD } from "../utils/constants.js";
import { RescueReport } from "../models/RescueReport.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { User } from "../models/User.js";
import { recordHistory } from "./reportService.js";
import { notifyRescueStatusChange } from "./notificationService.js";

const POPULATE_USER_FIELDS = "name email phone role avatar profileImage organization availability";

async function populateReport(reportOrId) {
  const id = reportOrId._id || reportOrId;
  return RescueReport.findById(id)
    .populate("reporter", POPULATE_USER_FIELDS)
    .populate("assignedRescuer", POPULATE_USER_FIELDS)
    .populate("rescueEvidence.submittedBy", POPULATE_USER_FIELDS)
    .populate("rescueEvidence.verifiedBy", POPULATE_USER_FIELDS)
    .populate("assignedOrganization");
}

/**
 * Transitions a report to a new status, keeping RescueAssignment, RescueHistory,
 * Notifications and rescuer counters all consistent.
 */
export async function transitionReport({ report, newStatus, user, note = "" }) {
  const previousStatus = report.status;

  if (!canTransition(previousStatus, newStatus)) {
    throw ApiError.conflict(`Cannot move a ${previousStatus} case to ${newStatus}`);
  }

  const timestampField = STATUS_TIMESTAMP_FIELD[newStatus];
  if (timestampField) report[timestampField] = new Date();
  report.status = newStatus;

  if (newStatus === "CANCELLED") {
    report.cancelledReason = note || report.cancelledReason || "";
  }

  // Keep the linked assignment in sync, if one exists.
  let assignment = report.assignment ? await RescueAssignment.findById(report.assignment) : null;

  if (["ACCEPTED", "IN_PROGRESS", "RESCUED", "CANCELLED"].includes(newStatus) && assignment) {
    if (newStatus === "ACCEPTED") {
      assignment.status = "ACCEPTED";
      assignment.acceptedAt = new Date();
    } else if (newStatus === "IN_PROGRESS") {
      assignment.status = "IN_PROGRESS";
      assignment.startedAt = new Date();
    } else if (newStatus === "RESCUED") {
      assignment.status = "COMPLETED";
      assignment.completedAt = new Date();
    } else if (newStatus === "CANCELLED") {
      assignment.status = "REJECTED";
      assignment.rejectedAt = new Date();
    }
    await assignment.save();
  }

  await report.save();
  await recordHistory({ report, user, previousStatus, newStatus, note });
  if (report.assignedRescuer) {
    const rescuer = await User.findById(report.assignedRescuer);
    if (rescuer) {
      if (newStatus === "IN_PROGRESS" && previousStatus !== "IN_PROGRESS") {
        rescuer.activeCases = (rescuer.activeCases || 0) + 1;
      }
      if (newStatus === "RESCUED" || newStatus === "CLOSED") {
        if (previousStatus === "IN_PROGRESS") {
          rescuer.activeCases = Math.max(0, (rescuer.activeCases || 0) - 1);
          rescuer.completedCases = (rescuer.completedCases || 0) + 1;
          const mins = report.rescueDurationMins;
          if (typeof mins === "number") {
            rescuer.totalResponseMins = (rescuer.totalResponseMins || 0) + mins;
          }
        }
      }
      if (newStatus === "CANCELLED" && previousStatus === "IN_PROGRESS") {
        rescuer.activeCases = Math.max(0, (rescuer.activeCases || 0) - 1);
      }
      await rescuer.save();
    }
  }

  await notifyRescueStatusChange({
    report,
    newStatus,
    actorName: user?.name,
  });

  return populateReport(report);
}

export { populateReport };
