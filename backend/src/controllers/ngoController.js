import { User } from "../models/User.js";
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
const ASSIGNABLE_STATUSES = ["REPORTED", "ASSIGNED"];

const REPORT_POPULATE = [
  { path: "reporter", select: "name email phone" },
  { path: "assignedRescuer", select: "name email phone availability" },
  { path: "assignedOrganization", select: "name" },
];

/** Resolves the caller's org scope: NGO users are locked to their own organization, ADMIN sees all. */
function orgScope(user, { requireOrganization = true } = {}) {
  if (user.role === "ADMIN") return null;
  if (!user.organization && requireOrganization) {
    throw ApiError.forbidden("Your account is not linked to an organization");
  }
  return user.organization;
}

export const getStats = asyncHandler(async (req, res) => {
  const org = orgScope(req.user, { requireOrganization: false });
  const isAdmin = req.user.role === "ADMIN";
  const orgMatch = isAdmin ? {} : org ? { assignedOrganization: org } : { assignedOrganization: null };

  const [unassigned, orgReports, activeRescues, completedRescues, criticalCases, rescuers] = await Promise.all([
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
  const filter = { role: "RESCUER" };
  if (org) filter.organization = org;

  const rescuers = await User.find(filter).sort({ name: 1 });
  const shaped = rescuers.map((r) => ({
    ...r.toObject(),
    avgResponseMins: r.avgResponseMins,
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

  const [overview, reportsByAnimal, reportsByStatus, reportsByPriority, monthly, performance] = await Promise.all([
    analyticsService.overview(match),
    analyticsService.reportsByAnimal(match),
    analyticsService.reportsByStatus(match),
    analyticsService.reportsByPriority(match),
    analyticsService.monthly(match),
    analyticsService.performance(match),
  ]);

  return ok(res, { overview, reportsByAnimal, reportsByStatus, reportsByPriority, monthly, performance });
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

  rescuer.activeCases = (rescuer.activeCases || 0) + 1;
  await rescuer.save();

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
    message: `You have been assigned to report ${report.reportId}.`,
    emergencyLevel: report.emergencyLevel,
  });

  await notifyUsers([report.reporter], {
    report: report._id,
    type: "STATUS_UPDATE",
    title: "Your report has been assigned",
    message: `A rescuer has been assigned to your report ${report.reportId}.`,
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
