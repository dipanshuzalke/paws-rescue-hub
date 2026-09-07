import { ApiError } from "../utils/apiError.js";
import { canTransition, STATUS_TIMESTAMP_FIELD } from "../utils/constants.js";
import { RescueReport } from "../models/RescueReport.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { User } from "../models/User.js";
import { recordHistory } from "./reportService.js";
import { notifyUsers } from "./notificationService.js";

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

  // Maintain rescuer counters.
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

  // Notifications
  const notifyPayload = {
    report: report._id,
    type: "STATUS_UPDATE",
    title: `Report ${report.reportId} updated`,
    message: `Status changed to ${newStatus}${note ? `: ${note}` : ""}`,
    emergencyLevel: report.emergencyLevel,
    link: `/reports/${report._id}`,
  };

  const recipients = [report.reporter];
  if (report.assignedRescuer) recipients.push(report.assignedRescuer);
  await notifyUsers(recipients, notifyPayload);

  if (newStatus === "ACCEPTED" || newStatus === "IN_PROGRESS") {
    let organizationId = report.assignedOrganization;
    if (!organizationId && report.assignedRescuer) {
      const assignedRescuer = await User.findById(report.assignedRescuer).select("organization");
      organizationId = assignedRescuer?.organization;
    }
    if (organizationId) {
      const ngoUsers = await User.find({
        role: "NGO",
        organization: organizationId,
        isActive: true,
      }).select("_id");
      await notifyUsers(ngoUsers, {
        report: report._id,
        type: "STATUS_UPDATE",
        title: newStatus === "ACCEPTED" ? "Rescuer accepted a request" : "Rescuer is on the way",
        message:
          newStatus === "ACCEPTED"
            ? `A rescuer accepted report ${report.reportId}.`
            : `${report.assignedRescuer ? "The assigned rescuer" : "A rescuer"} is on the way for report ${report.reportId}.`,
        emergencyLevel: report.emergencyLevel,
        link: `/ngo/requests/${report._id}`,
      });
    }
  }

  return populateReport(report);
}

export { populateReport };
