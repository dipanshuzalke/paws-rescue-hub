import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";
import { publishNotification } from "./realtimeNotificationService.js";

function asId(value) {
  if (!value) return null;
  return String(value._id || value.id || value);
}

function uniqueIds(values = []) {
  return [...new Set((values || []).map(asId).filter(Boolean))];
}

function displayName(userOrName) {
  if (!userOrName) return "The rescuer";
  if (typeof userOrName === "string") return userOrName;
  return userOrName.name || "The rescuer";
}

export function notificationLink(role, reportId, variant = "report") {
  if (!reportId) return "";
  const id = asId(reportId);
  if (role === "CITIZEN") return `/citizen/reports/${id}`;
  if (role === "RESCUER") return `/rescuer/requests/${id}`;
  if (role === "NGO") {
    return variant === "evidence" ? `/ngo/evidence-review/${id}` : `/ngo/requests/${id}`;
  }
  return `/admin/reports/${id}`;
}

/** Creates a single notification. Never throws — logs and swallows failures. */
export async function createNotification({
  recipient,
  report,
  type,
  title,
  message,
  emergencyLevel,
  link,
  dedupeKey,
}) {
  try {
    if (!recipient) return null;
    const recipientId = asId(recipient);
    if (dedupeKey) {
      const existing = await Notification.findOne({ recipient: recipientId, dedupeKey });
      if (existing) return existing;
    }
    const notification = await Notification.create({
      recipient: recipientId,
      report: report || null,
      type: type || "SYSTEM",
      title,
      message,
      emergencyLevel: emergencyLevel || null,
      link: link || "",
      dedupeKey: dedupeKey || undefined,
    });
    publishNotification(notification);
    return notification;
  } catch (err) {
    if (err?.code === 11000 && dedupeKey) {
      return Notification.findOne({ recipient: asId(recipient), dedupeKey });
    }
    console.error("[notificationService] createNotification failed:", err.message);
    return null;
  }
}

/** Fans a payload out to a list of recipient user ids. */
export async function notifyUsers(recipients = [], payload = {}) {
  try {
    const ids = uniqueIds(recipients);
    if (!ids.length) return [];
    return await Promise.all(ids.map((recipient) => createNotification({ ...payload, recipient })));
  } catch (err) {
    console.error("[notificationService] notifyUsers failed:", err.message);
    return [];
  }
}

/** Fans a payload out to every active user of a given role. */
export async function notifyRole(role, payload = {}) {
  try {
    const roles = Array.isArray(role) ? role : [role];
    const users = await User.find({ role: { $in: roles }, isActive: true }).select("_id role");
    return await notifyUsers(users, payload);
  } catch (err) {
    console.error("[notificationService] notifyRole failed:", err.message);
    return [];
  }
}

async function activeUsersByRole(role, extra = {}) {
  return User.find({ role, isActive: true, ...extra }).select("_id role name");
}

export async function ngoUsersForReport(report) {
  const organizationId = asId(report?.assignedOrganization);
  const filter = { role: "NGO", isActive: true };
  if (organizationId) filter.organization = organizationId;
  return User.find(filter).select("_id role name");
}

async function notifyEach(users, payload, variant = "report") {
  const list = (users || []).filter(Boolean);
  if (!list.length) return [];
  return Promise.all(
    list.map((user) =>
      createNotification({
        ...payload,
        recipient: asId(user),
        link: payload.link || notificationLink(user.role, payload.report, variant),
      }),
    ),
  );
}

/** 1. Citizen created a report → relevant NGO + Admin (not every rescuer). */
export async function notifyNewReport(report) {
  const [ngos, admins] = await Promise.all([
    activeUsersByRole("NGO"),
    activeUsersByRole("ADMIN"),
  ]);
  const emergency = report.emergencyLevel === "CRITICAL" || report.emergencyLevel === "HIGH";
  const title = emergency
    ? `Emergency rescue request (${report.emergencyLevel})`
    : "New rescue request";
  const message = `${report.animalType} reported ${String(report.condition || "").toLowerCase()} at ${report.address}`;
  const payload = {
    report: report._id,
    type: "NEW_REPORT",
    title,
    message,
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `NEW_REPORT:${asId(report._id)}`,
  };
  await notifyEach(ngos, payload);
  await notifyEach(admins, payload);
}

/** 2. NGO assigned a rescuer. */
export async function notifyRescuerAssigned({ report, rescuer, isReassignment = false }) {
  const rescuerId = asId(rescuer);
  if (!rescuerId) return null;
  return createNotification({
    recipient: rescuerId,
    report: report._id,
    type: "ASSIGNMENT",
    title: isReassignment ? "Rescue assignment updated" : "New rescue assignment",
    message: "You have been assigned a new rescue case.",
    emergencyLevel: report.emergencyLevel,
    link: notificationLink("RESCUER", report._id),
    dedupeKey: `ASSIGNMENT:${asId(report._id)}:${rescuerId}`,
  });
}

export async function notifyPreviousRescuerReassigned({ report, previousRescuerId }) {
  if (!previousRescuerId) return null;
  return createNotification({
    recipient: previousRescuerId,
    report: report._id,
    type: "ASSIGNMENT",
    title: "Rescue assignment changed",
    message: `Report ${report.reportId} has been reassigned to another rescuer.`,
    emergencyLevel: report.emergencyLevel,
    link: notificationLink("RESCUER", report._id),
    dedupeKey: `ASSIGNMENT_REMOVED:${asId(report._id)}:${asId(previousRescuerId)}`,
  });
}

/** 3. Rescuer accepted. */
export async function notifyAssignmentAccepted({ report, rescuerName }) {
  const name = displayName(rescuerName);
  return notifyEach(await ngoUsersForReport(report), {
    report: report._id,
    type: "RESCUE_ACCEPTED",
    title: "Rescue assignment accepted",
    message: `${name} has accepted the rescue assignment.`,
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `RESCUE_ACCEPTED:${asId(report._id)}`,
  });
}

/** 4. Rescuer rejected. */
export async function notifyAssignmentRejected({ report, rescuerName, reason }) {
  const name = displayName(rescuerName);
  const reasonText = reason?.trim() ? ` Reason: ${reason.trim()}` : "";
  return notifyEach(await ngoUsersForReport(report), {
    report: report._id,
    type: "ASSIGNMENT_REJECTED",
    title: "Rescue assignment rejected",
    message: `${name} has rejected the rescue assignment.${reasonText}`,
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `ASSIGNMENT_REJECTED:${asId(report._id)}:${asId(report.assignment) || "none"}`,
  });
}

/** 5. Rescuer reached the location (IN_PROGRESS). */
export async function notifyReachedLocation({ report, rescuerName }) {
  const name = displayName(rescuerName);
  const payload = {
    report: report._id,
    type: "RESCUE_STARTED",
    title: "Rescuer reached the location",
    message: `${name} has reached the reported location.`,
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `RESCUE_STARTED:${asId(report._id)}`,
  };
  const reporter = asId(report.reporter);
  await Promise.all([
    reporter
      ? createNotification({
          ...payload,
          recipient: reporter,
          link: notificationLink("CITIZEN", report._id),
        })
      : null,
    notifyEach(await ngoUsersForReport(report), payload),
  ]);
}

/** 6. Status is RESCUED. */
export async function notifyAnimalRescued(report) {
  const payload = {
    report: report._id,
    type: "RESCUE_COMPLETED",
    title: "Animal rescued",
    message: "The animal has been successfully rescued.",
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `RESCUE_COMPLETED:${asId(report._id)}`,
  };
  const reporter = asId(report.reporter);
  await Promise.all([
    reporter
      ? createNotification({
          ...payload,
          recipient: reporter,
          link: notificationLink("CITIZEN", report._id),
        })
      : null,
    notifyEach(await ngoUsersForReport(report), payload),
  ]);
}

/** 7. Evidence submitted → assigned NGO, with verification deep-link. */
export async function notifyEvidenceSubmitted({ report, rescuerName, submissionCount = 1 }) {
  const name = displayName(rescuerName);
  return notifyEach(
    await ngoUsersForReport(report),
    {
      report: report._id,
      type: "EVIDENCE_SUBMITTED",
      title: "Rescue evidence submitted",
      message: `${name} has submitted rescue evidence for verification.`,
      emergencyLevel: report.emergencyLevel,
      dedupeKey: `EVIDENCE_SUBMITTED:${asId(report._id)}:${submissionCount}`,
    },
    "evidence",
  );
}

/** 8. Evidence verified or rejected → assigned rescuer. */
export async function notifyEvidenceReviewed({ report, verified, reason }) {
  const rescuerId = asId(report.assignedRescuer) || asId(report.rescueEvidence?.submittedBy);
  if (!rescuerId) return null;
  const note = reason?.trim();
  if (verified) {
    return createNotification({
      recipient: rescuerId,
      report: report._id,
      type: "EVIDENCE_VERIFIED",
      title: "Rescue evidence verified",
      message: note
        ? `Your rescue evidence has been verified. ${note}`
        : "Your rescue evidence has been verified.",
      emergencyLevel: report.emergencyLevel,
      link: notificationLink("RESCUER", report._id),
      dedupeKey: `EVIDENCE_VERIFIED:${asId(report._id)}:${report.rescueEvidence?.submissionCount || 1}`,
    });
  }
  return createNotification({
    recipient: rescuerId,
    report: report._id,
    type: "EVIDENCE_REJECTED",
    title: "Rescue evidence rejected",
    message: note
      ? `Your rescue evidence was rejected. Reason: ${note}`
      : "Your rescue evidence was rejected.",
    emergencyLevel: report.emergencyLevel,
    link: notificationLink("RESCUER", report._id),
    dedupeKey: `EVIDENCE_REJECTED:${asId(report._id)}:${report.rescueEvidence?.submissionCount || 1}`,
  });
}

/** 9. Case closed → citizen and rescuer. */
export async function notifyCaseClosed(report) {
  const payload = {
    report: report._id,
    type: "CASE_CLOSED",
    title: "Rescue case closed",
    message: "Your rescue case has been completed and closed.",
    emergencyLevel: report.emergencyLevel,
    dedupeKey: `CASE_CLOSED:${asId(report._id)}`,
  };
  const reporter = asId(report.reporter);
  const rescuer = asId(report.assignedRescuer);
  await Promise.all([
    reporter
      ? createNotification({
          ...payload,
          recipient: reporter,
          link: notificationLink("CITIZEN", report._id),
        })
      : null,
    rescuer && rescuer !== reporter
      ? createNotification({
          ...payload,
          recipient: rescuer,
          link: notificationLink("RESCUER", report._id),
        })
      : null,
  ]);
}

/** 10. Admin-only major events, never stacked with the same dedupe key. */
export async function notifyAdmins({ report, type, title, message, dedupeKey }) {
  const admins = await activeUsersByRole("ADMIN");
  return notifyEach(admins, {
    report: report?._id || report,
    type: type || "SYSTEM",
    title,
    message,
    emergencyLevel: report?.emergencyLevel,
    dedupeKey,
  });
}

export async function notifyDuplicateFlagged({ report, primary }) {
  const reporter = asId(report.reporter);
  const primaryId = asId(primary._id);
  await Promise.all([
    reporter
      ? createNotification({
          recipient: reporter,
          report: primaryId,
          type: "DUPLICATE_FLAGGED",
          title: "Your report was linked to an existing case",
          message: `We are already handling this rescue under case ${primary.reportId}.`,
          emergencyLevel: report.emergencyLevel,
          link: notificationLink("CITIZEN", primaryId),
          dedupeKey: `DUPLICATE_FLAGGED:${asId(report._id)}`,
        })
      : null,
    notifyAdmins({
      report: primary,
      type: "DUPLICATE_FLAGGED",
      title: "Duplicate report flagged",
      message: `Report ${report.reportId} was marked as a duplicate of ${primary.reportId}.`,
      dedupeKey: `ADMIN_DUPLICATE:${asId(report._id)}`,
    }),
  ]);
}

/** Status-driven notifications used by transitionReport. */
export async function notifyRescueStatusChange({ report, newStatus, actorName }) {
  if (newStatus === "ACCEPTED") {
    await notifyAssignmentAccepted({ report, rescuerName: actorName });
    return;
  }
  if (newStatus === "IN_PROGRESS") {
    await notifyReachedLocation({ report, rescuerName: actorName });
    return;
  }
  if (newStatus === "RESCUED") {
    await notifyAnimalRescued(report);
    return;
  }
  if (newStatus === "CLOSED") {
    await notifyCaseClosed(report);
    await notifyAdmins({
      report,
      type: "CASE_CLOSED",
      title: "Rescue case closed",
      message: `Case ${report.reportId} has been completed and closed.`,
      dedupeKey: `ADMIN_CLOSED:${asId(report._id)}`,
    });
  }
}
