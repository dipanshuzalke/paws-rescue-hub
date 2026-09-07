import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { RescueReport } from "../models/RescueReport.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { asyncHandler, ApiError } from "../utils/apiError.js";
import { ok, list, buildPagination, parseQueryOptions } from "../utils/apiResponse.js";
import { buildReportFilter, paginateReports } from "../services/reportService.js";
import * as analyticsService from "../services/analyticsService.js";

const ACTIVE_STATUSES = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"];
const COMPLETED_STATUSES = ["RESCUED", "CLOSED"];
const PRESENCE_WINDOW_MS = 90 * 1000;

const REPORT_POPULATE = [
  { path: "reporter", select: "name email phone" },
  { path: "assignedRescuer", select: "name email phone" },
  { path: "assignedOrganization", select: "name" },
];

async function respondPaginatedReports(res, filter, options) {
  const result = await paginateReports(filter, options, REPORT_POPULATE);
  const items = result.items || result.docs || result.data || [];
  const total = result.total ?? result.count ?? items.length;
  const pagination = result.pagination || buildPagination({ page: options.page, limit: options.limit, total });
  return list(res, items, pagination);
}

export const getStats = asyncHandler(async (_req, res) => {
  const [totalUsers, citizens, rescuers, ngos, totalReports, activeRescues, completedRescues, criticalCases] =
    await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "CITIZEN" }),
      User.countDocuments({ role: "RESCUER" }),
      User.countDocuments({ role: "NGO" }),
      RescueReport.countDocuments({}),
      RescueReport.countDocuments({ status: { $in: ACTIVE_STATUSES } }),
      RescueReport.countDocuments({ status: { $in: COMPLETED_STATUSES } }),
      RescueReport.countDocuments({ emergencyLevel: "CRITICAL" }),
    ]);

  return ok(res, {
    totalUsers,
    citizens,
    rescuers,
    ngos,
    totalReports,
    activeRescues,
    completedRescues,
    criticalCases,
  });
});

export const getUsers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const filter = {};
  if (req.query.role) filter.role = req.query.role;
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) {
    const rx = new RegExp(req.query.search, "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }

  const [items, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return list(res, items, buildPagination({ page, limit, total }));
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");
  return ok(res, user);
});

export const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  const updates = { ...req.body };
  // Password changes never go through this endpoint, and role escalation to ADMIN
  // must be an explicit, deliberate admin decision — never an incidental field.
  delete updates.password;
  if (updates.role === "ADMIN" && req.user.role !== "ADMIN") {
    delete updates.role;
  }

  Object.assign(user, updates);
  await user.save();
  return ok(res, user);
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw ApiError.notFound("User not found");

  if (req.body.status) user.status = req.body.status;
  if (req.body.isActive !== undefined) user.isActive = Boolean(req.body.isActive);
  if (user.status === "SUSPENDED" || user.status === "INACTIVE") user.isActive = false;
  if (user.status === "ACTIVE" && req.body.isActive === undefined) user.isActive = true;

  await user.save();
  return ok(res, user);
});

export const getRescuers = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "name" });
  const filter = { role: "RESCUER" };
  if (req.query.organization) filter.organization = req.query.organization;
  if (req.query.search) {
    const rx = new RegExp(req.query.search, "i");
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  const [rescuers, total] = await Promise.all([
    User.find(filter).sort(sort).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);
  const now = Date.now();
  const items = rescuers.map((rescuer) => ({
    ...rescuer.toJSON(),
    isOnline:
      rescuer.availability !== "OFFLINE" &&
      Boolean(rescuer.lastSeenAt && now - new Date(rescuer.lastSeenAt).getTime() <= PRESENCE_WINDOW_MS),
  }));
  return list(res, items, buildPagination({ page, limit, total }));
});

export const getReports = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const filter = buildReportFilter(req.query, {});
  await respondPaginatedReports(res, filter, { page, limit, skip, sort });
});

export const getNgos = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const filter = {};
  if (req.query.verificationStatus) filter.verificationStatus = req.query.verificationStatus;
  if (req.query.search) {
    const rx = new RegExp(req.query.search, "i");
    filter.$or = [{ name: rx }, { email: rx }, { address: rx }];
  }

  const [orgs, total] = await Promise.all([
    Organization.find(filter).sort(sort).skip(skip).limit(limit),
    Organization.countDocuments(filter),
  ]);

  const orgIds = orgs.map((o) => o._id);
  const [rescuerCounts, caseCounts] = await Promise.all([
    User.aggregate([
      { $match: { role: "RESCUER", organization: { $in: orgIds } } },
      { $group: { _id: "$organization", count: { $sum: 1 } } },
    ]),
    RescueReport.aggregate([
      { $match: { assignedOrganization: { $in: orgIds } } },
      { $group: { _id: "$assignedOrganization", count: { $sum: 1 } } },
    ]),
  ]);

  const rescuerMap = new Map(rescuerCounts.map((r) => [String(r._id), r.count]));
  const caseMap = new Map(caseCounts.map((c) => [String(c._id), c.count]));

  const now = Date.now();
  const items = orgs.map((org) => ({
    ...org.toObject(),
    rescuerCount: rescuerMap.get(String(org._id)) || 0,
    caseCount: caseMap.get(String(org._id)) || 0,
    isOnline: Boolean(org.lastSeenAt && now - new Date(org.lastSeenAt).getTime() <= PRESENCE_WINDOW_MS),
  }));

  return list(res, items, buildPagination({ page, limit, total }));
});

export const getNgoById = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound("Organization not found");
  return ok(res, org);
});

export const updateNgo = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound("Organization not found");
  const updates = { ...req.body };
  delete updates.verificationStatus;
  Object.assign(org, updates);
  await org.save();
  return ok(res, org);
});

export const verifyNgo = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound("Organization not found");
  org.verificationStatus = "VERIFIED";
  org.isActive = true;
  await org.save();
  return ok(res, org);
});

export const rejectNgo = asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.params.id);
  if (!org) throw ApiError.notFound("Organization not found");
  org.verificationStatus = "REJECTED";
  await org.save();
  return ok(res, org);
});

export const getActivity = asyncHandler(async (req, res) => {
  const { limit } = parseQueryOptions(req.query, { defaultSort: "timestamp" });
  const entries = await RescueHistory.find({})
    .sort({ timestamp: -1 })
    .limit(limit)
    .populate("report", "reportId animalType")
    .populate("changedBy", "name role");

  const mapped = entries.map((entry) => ({
    id: entry._id,
    at: entry.timestamp,
    actor: entry.changedBy?.name || entry.changedByName || "System",
    action: entry.newStatus,
    target: entry.report?.reportId || null,
    kind: "REPORT_STATUS",
  }));

  return ok(res, mapped);
});

export const getAnalytics = asyncHandler(async (_req, res) => {
  const match = {};
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
