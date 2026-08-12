import { RescueReport } from "../models/RescueReport.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { parseQueryOptions, buildPagination } from "../utils/apiResponse.js";

const ALLOWED_SORT = ["createdAt", "reportedAt", "emergencyLevel", "status", "updatedAt"];

/**
 * Builds a mongoose filter from a validated query object.
 * `scope` can carry extra constraints (e.g. { reporter: userId }).
 */
export function buildReportFilter(query = {}, scope = {}) {
  const filter = { ...scope };

  if (query.search) {
    filter.$or = [
      { description: { $regex: query.search, $options: "i" } },
      { address: { $regex: query.search, $options: "i" } },
      { title: { $regex: query.search, $options: "i" } },
    ];
  }
  if (query.animalType) filter.animalType = query.animalType;
  if (query.condition) filter.condition = query.condition;
  if (query.emergencyLevel) filter.emergencyLevel = query.emergencyLevel;
  if (query.status) filter.status = query.status;
  if (query.city) filter.city = { $regex: `^${query.city}$`, $options: "i" };
  if (query.assignedRescuer) filter.assignedRescuer = query.assignedRescuer;

  if (query.dateFrom || query.dateTo) {
    filter.reportedAt = {};
    if (query.dateFrom) filter.reportedAt.$gte = new Date(query.dateFrom);
    if (query.dateTo) filter.reportedAt.$lte = new Date(query.dateTo);
  }

  return filter;
}

/** Paginates RescueReport with optional population, using shared pagination helpers. */
export async function paginateReports(filter, options = {}, populate = []) {
  const { page, limit, skip, sort } = parseQueryOptions(options, {
    defaultSort: "createdAt",
    allowedSort: ALLOWED_SORT,
  });

  let query = RescueReport.find(filter).sort(sort).skip(skip).limit(limit);
  for (const p of populate) query = query.populate(p);

  const [items, total] = await Promise.all([query.exec(), RescueReport.countDocuments(filter)]);

  return { items, pagination: buildPagination({ page, limit, total }) };
}

/** Writes a RescueHistory entry for a status change. */
export async function recordHistory({ report, user, previousStatus, newStatus, note = "" }) {
  return RescueHistory.create({
    report: report._id || report,
    changedBy: user?._id || null,
    changedByName: user?.name || "System",
    changedByRole: user?.role || "SYSTEM",
    previousStatus: previousStatus || "NONE",
    newStatus,
    note,
  });
}
