import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { RescueReport } from "../models/RescueReport.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { asyncHandler, ApiError } from "../utils/apiError.js";
import { ok, created, list, buildPagination, parseQueryOptions } from "../utils/apiResponse.js";
import { assignmentSchema } from "../utils/validators.js";
import { buildReportFilter, paginateReports, recordHistory } from "../services/reportService.js";
import { createNotification, notifyUsers } from "../services/notificationService.js";
import * as analyticsService from "../services/analyticsService.js";

const ACTIVE_STATUSES = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"];
const ASSIGNABLE_STATUSES = ["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS"];
const PRESENCE_WINDOW_MS = 90 * 1000;

function distanceKm(from, to) {
  if (!from || !to || from.length < 2 || to.length < 2) return null;
  const [fromLng, fromLat] = from;
  const [toLng, toLat] = to;
  const radians = (value) => (value * Math.PI) / 180;
  const latDelta = radians(toLat - fromLat);
  const lngDelta = radians(toLng - fromLng);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(radians(fromLat)) * Math.cos(radians(toLat)) * Math.sin(lngDelta / 2) ** 2;
  return Math.round(6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)) * 10) / 10;
}

const REPORT_POPULATE = [
  { path: "reporter", select: "name email phone" },
  { path: "assignedRescuer", select: "name email phone availability" },
  { path: "assignedOrganization", select: "name" },
];

/** Resolves the caller's org scope: NGO users are locked to their own organization, ADMIN sees all. */
function orgScope(user, { requireOrganization = false } = {}) {
  if (user.role === "ADMIN") return null;
  if (!user.organization && requireOrganization) {
    throw ApiError.forbidden("Your account is not linked to an organization");
  }
  return user.organization;
}

export const getStats = asyncHandler(async (req, res) => {
  const org = orgScope(req.user, { requireOrganization: false });
  const isAdmin = req.user.role === "ADMIN";
  const orgMatch = isAdmin
    ? {}
    : org
      ? { assignedOrganization: org }
      : { assignedOrganization: null };

  const [unassigned, orgReports, activeRescues, completedRescues, criticalCases, rescuers] =
    await Promise.all([
      RescueReport.countDocuments({ assignedOrganization: null, status: "REPORTED" }),
      RescueReport.countDocuments(orgMatch),
      RescueReport.countDocuments({ ...orgMatch, status: { $in: ACTIVE_STATUSES } }),
      RescueReport.countDocuments({ ...orgMatch, status: { $in: ["RESCUED", "CLOSED"] } }),
      RescueReport.countDocuments({ ...orgMatch, emergencyLevel: "CRITICAL" }),
      User.countDocuments(org ? { role: "RESCUER", organization: org } : { role: "RESCUER" }),
    ]);

  return ok(res, {
    unassignedReports: unassigned,
    totalReports: orgReports,
    activeRescues,
    completedRescues,
    criticalCases,
    rescuers,
  });
});

export const getProfile = asyncHandler(async (req, res) => {
  const org = orgScope(req.user, { requireOrganization: true });
  const profile = await Organization.findById(org);
  if (!profile) throw ApiError.notFound("Organization not found");
  return ok(res, profile);
});

export const updateProfile = asyncHandler(async (req, res) => {
  const org = orgScope(req.user, { requireOrganization: true });

  const profile = await Organization.findById(org);

  if (!profile) {
    throw ApiError.notFound("Organization not found");
  }

  /*
   * Update organization fields
   */
  if (req.body.name !== undefined) {
    profile.name = req.body.name.trim();
  }

  if (req.body.registrationNumber !== undefined) {
    profile.registrationNumber = req.body.registrationNumber.trim();
  }

  if (req.body.contactPerson !== undefined) {
    profile.contactPerson = req.body.contactPerson.trim();
  }

  if (req.body.email !== undefined) {
    profile.email = req.body.email.trim().toLowerCase();
  }

  if (req.body.phone !== undefined) {
    profile.phone = req.body.phone.trim();
  }

  if (req.body.areasServed !== undefined) {
    profile.areasServed = req.body.areasServed.trim();
  }

  if (req.body.description !== undefined) {
    profile.about = req.body.description.trim();
  }

  /*
   * Keep the NGO's login User account synchronized.
   *
   * User.email is what your authentication system uses
   * for login.
   */
  const user = await User.findById(req.user._id);

  if (!user) {
    throw ApiError.notFound("User account not found");
  }

  if (req.body.contactPerson !== undefined) {
    user.name = req.body.contactPerson.trim();
  }

  if (req.body.email !== undefined) {
    const email = req.body.email.trim().toLowerCase();

    /*
     * Make sure another user isn't already using
     * the new email address.
     */
    const existingUser = await User.findOne({
      email,
      _id: { $ne: user._id },
    });

    if (existingUser) {
      throw ApiError.conflict("This email address is already being used by another account.");
    }

    user.email = email;
  }

  if (req.body.phone !== undefined) {
    user.phone = req.body.phone.trim();
  }

  await profile.save();
  await user.save();

  return ok(res, profile, "Organization profile updated successfully");
});

export const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const org = orgScope(req.user, { requireOrganization: false });
  const scope =
    req.user.role === "ADMIN"
      ? {}
      : org
        ? { $or: [{ assignedOrganization: null }, { assignedOrganization: org }] }
        : { assignedOrganization: null };
  const filter = buildReportFilter(req.query, scope);

  const result = await paginateReports(filter, { page, limit, skip, sort }, REPORT_POPULATE);
  const items = result.items || result.docs || result.data || [];
  const total = result.total ?? result.count ?? items.length;
  const pagination = result.pagination || buildPagination({ page, limit, total });
  return list(res, items, pagination);
});

export const getActiveRescues = asyncHandler(async (req, res) => {
  const org = orgScope(req.user);
  const filter = { status: { $in: ACTIVE_STATUSES } };
  if (org) filter.assignedOrganization = org;

  const reports = await RescueReport.find(filter)
    .sort({ assignedAt: -1 })
    .populate(REPORT_POPULATE);

  return ok(res, reports);
});

export const getRescuers = asyncHandler(async (req, res) => {
  const org = orgScope(req.user);
  // Rescuers in this NGO plus unaffiliated rescuers available for assignment.
  const filter = org
    ? { role: "RESCUER", $or: [{ organization: org }, { organization: null }] }
    : { role: "RESCUER" };

  const [rescuers, organization] = await Promise.all([
    User.find(filter).sort({ name: 1 }),
    org ? Organization.findById(org).select("location") : null,
  ]);
  const organizationCoords = organization?.location?.coordinates;
  const shaped = rescuers.map((r) => ({
    ...r.toObject(),
    distanceKm: distanceKm(organizationCoords, r.location?.coordinates),
    avgResponseMins: r.avgResponseMins,
    isOnline:
      r.availability !== "OFFLINE" &&
      Boolean(r.lastSeenAt && Date.now() - new Date(r.lastSeenAt).getTime() <= PRESENCE_WINDOW_MS),
  }));

  return ok(res, shaped);
});

export const getHistory = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "timestamp" });
  const org = orgScope(req.user);

  const reportFilter = org ? { assignedOrganization: org } : {};
  const reportIds = org ? await RescueReport.find(reportFilter).distinct("_id") : null;

  const filter = reportIds ? { report: { $in: reportIds } } : {};

  const [items, total] = await Promise.all([
    RescueHistory.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("report", "reportId animalType status")
      .populate("changedBy", "name role"),
    RescueHistory.countDocuments(filter),
  ]);

  return list(res, items, buildPagination({ page, limit, total }));
});

export const getAnalytics = asyncHandler(async (req, res) => {
  const org = orgScope(req.user);
  const match = org ? { assignedOrganization: org } : {};

  const [overview, reportsByAnimal, reportsByStatus, reportsByPriority, monthly, performance] =
    await Promise.all([
      analyticsService.overview(match),
      analyticsService.reportsByAnimal(match),
      analyticsService.reportsByStatus(match),
      analyticsService.reportsByPriority(match),
      analyticsService.monthly(match),
      analyticsService.performance(match),
    ]);

  return ok(res, {
    overview,
    reportsByAnimal,
    reportsByStatus,
    reportsByPriority,
    monthly,
    performance,
  });
});

async function findReportByAnyId(id) {
  let report = null;
  if (id.match(/^[0-9a-fA-F]{24}$/)) {
    report = await RescueReport.findById(id);
  }
  if (!report) report = await RescueReport.findOne({ reportId: id });
  return report;
}

export const createAssignment = asyncHandler(async (req, res) => {
  const { reportId, rescuerId, notes } = req.body;
  const org = orgScope(req.user);

  const report = await findReportByAnyId(reportId);
  if (!report) throw ApiError.notFound("Report not found");
  if (!ASSIGNABLE_STATUSES.includes(report.status)) {
    throw ApiError.conflict(`Report with status ${report.status} cannot be assigned`);
  }
  if (org && report.assignedOrganization && String(report.assignedOrganization) !== String(org)) {
    throw ApiError.forbidden("This report belongs to another organization");
  }

  const rescuer = await User.findById(rescuerId);
  if (!rescuer || rescuer.role !== "RESCUER") throw ApiError.notFound("Rescuer not found");
  if (!rescuer.isActive || rescuer.status !== "ACTIVE") {
    throw ApiError.badRequest("This rescuer is not currently active");
  }

  const organizationId = org || rescuer.organization || report.assignedOrganization || null;
  const previousRescuerId = report.assignedRescuer ? String(report.assignedRescuer) : null;
  const isReassignment = previousRescuerId && previousRescuerId !== String(rescuer._id);

  if (isReassignment) {
    if (report.assignment) {
      const previousAssignment = await RescueAssignment.findById(report.assignment);
      if (previousAssignment) {
        previousAssignment.status = "REJECTED";
        previousAssignment.rejectedAt = new Date();
        await previousAssignment.save();
      }
    }
    const previousRescuer = await User.findById(previousRescuerId);
    if (previousRescuer) {
      previousRescuer.activeCases = Math.max(0, (previousRescuer.activeCases || 0) - 1);
      await previousRescuer.save();
    }
    await createNotification({
      recipient: previousRescuerId,
      report: report._id,
      type: "ASSIGNMENT",
      title: "Rescue assignment changed",
      message: `Report ${report.reportId} has been reassigned to another rescuer.`,
      emergencyLevel: report.emergencyLevel,
      link: `/rescuer/requests/${report._id}`,
    });
  }

  const assignment = await RescueAssignment.create({
    report: report._id,
    rescuer: rescuer._id,
    organization: organizationId,
    assignedBy: req.user._id,
    notes: notes || "",
  });

  const previousStatus = report.status;
  report.status = "ASSIGNED";
  report.assignedRescuer = rescuer._id;
  report.assignedOrganization = organizationId;
  report.assignment = assignment._id;
  report.assignedAt = new Date();
  await report.save();

  if (!previousRescuerId || isReassignment) {
    rescuer.activeCases = (rescuer.activeCases || 0) + 1;
    await rescuer.save();
  }

  await recordHistory({
    report,
    user: req.user,
    previousStatus,
    newStatus: "ASSIGNED",
    note: notes || "Rescuer assigned",
  });

  await createNotification({
    recipient: rescuer._id,
    report: report._id,
    type: "ASSIGNMENT",
    title: "New rescue assignment",
    message: isReassignment
      ? `Report ${report.reportId} has been reassigned to you. Please review it promptly.`
      : `You have been assigned to report ${report.reportId}. Please review it promptly.`,
    emergencyLevel: report.emergencyLevel,
    link: `/rescuer/requests/${report._id}`,
  });

  await notifyUsers([report.reporter], {
    report: report._id,
    type: "STATUS_UPDATE",
    title: "A rescuer is reviewing your report",
    message: `A rescuer has been selected for report ${report.reportId} and is awaiting acceptance.`,
    emergencyLevel: report.emergencyLevel,
  });

  const populated = await RescueReport.findById(report._id).populate(REPORT_POPULATE);
  return created(res, populated, "Rescuer assigned successfully");
});

export const getAssignments = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const org = orgScope(req.user);
  const filter = org ? { organization: org } : {};

  const [items, total] = await Promise.all([
    RescueAssignment.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("report", "reportId animalType status emergencyLevel")
      .populate("rescuer", "name email phone")
      .populate("assignedBy", "name role"),
    RescueAssignment.countDocuments(filter),
  ]);

  return list(res, items, buildPagination({ page, limit, total }));
});
