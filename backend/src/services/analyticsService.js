import { RescueReport } from "../models/RescueReport.js";
import { REPORT_STATUSES } from "../utils/constants.js";

const ACTIVE_STATUSES = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"];
const COMPLETED_STATUSES = ["RESCUED", "CLOSED"];

function baseMatch(match = {}) {
  return { ...match };
}

/** Adds a `<name>Mins` field computed as (end - start) / 60000, null-safe. */
function durationField(name, startField, endField) {
  return {
    [name]: {
      $cond: [
        { $and: [`$${startField}`, `$${endField}`] },
        { $divide: [{ $subtract: [`$${endField}`, `$${startField}`] }, 60000] },
        null,
      ],
    },
  };
}

export async function overview(match = {}) {
  const m = baseMatch(match);
  const [totalReports, activeRescues, completedRescues, criticalCases, durations] = await Promise.all([
    RescueReport.countDocuments(m),
    RescueReport.countDocuments({ ...m, status: { $in: ACTIVE_STATUSES } }),
    RescueReport.countDocuments({ ...m, status: { $in: COMPLETED_STATUSES } }),
    RescueReport.countDocuments({ ...m, emergencyLevel: "CRITICAL" }),
    RescueReport.aggregate([
      { $match: m },
      {
        $addFields: {
          ...durationField("responseMins", "reportedAt", "assignedAt"),
          ...durationField("rescueDurationMins", "startedAt", "rescuedAt"),
        },
      },
      {
        $group: {
          _id: null,
          avgResponseMins: { $avg: "$responseMins" },
          avgRescueDurationMins: { $avg: "$rescueDurationMins" },
        },
      },
    ]),
  ]);

  const d = durations[0] || {};
  return {
    totalReports,
    activeRescues,
    completedRescues,
    criticalCases,
    avgResponseMins: Math.round(d.avgResponseMins || 0),
    avgRescueDurationMins: Math.round(d.avgRescueDurationMins || 0),
  };
}

export async function reportsByAnimal(match = {}) {
  const rows = await RescueReport.aggregate([
    { $match: baseMatch(match) },
    { $group: { _id: "$animalType", count: { $sum: 1 } } },
    { $project: { _id: 0, animalType: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]);
  return rows;
}

export async function reportsByStatus(match = {}) {
  const rows = await RescueReport.aggregate([
    { $match: baseMatch(match) },
    { $group: { _id: "$status", count: { $sum: 1 } } },
    { $project: { _id: 0, status: "$_id", count: 1 } },
  ]);
  // Ensure every known status appears, even with zero count.
  const byStatus = Object.fromEntries(rows.map((r) => [r.status, r.count]));
  return REPORT_STATUSES.map((status) => ({ status, count: byStatus[status] || 0 }));
}

export async function reportsByPriority(match = {}) {
  const rows = await RescueReport.aggregate([
    { $match: baseMatch(match) },
    { $group: { _id: "$emergencyLevel", count: { $sum: 1 } } },
    { $project: { _id: 0, emergencyLevel: "$_id", count: 1 } },
    { $sort: { count: -1 } },
  ]);
  return rows;
}

export async function monthly(match = {}) {
  const since = new Date();
  since.setMonth(since.getMonth() - 11);
  since.setDate(1);
  since.setHours(0, 0, 0, 0);

  const m = { ...baseMatch(match), reportedAt: { $gte: since } };

  const rows = await RescueReport.aggregate([
    { $match: m },
    {
      $group: {
        _id: { year: { $year: "$reportedAt" }, month: { $month: "$reportedAt" } },
        reports: { $sum: 1 },
        rescued: {
          $sum: { $cond: [{ $in: ["$status", COMPLETED_STATUSES] }, 1, 0] },
        },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ]);

  const byKey = new Map(
    rows.map((r) => [`${r._id.year}-${r._id.month}`, { reports: r.reports, rescued: r.rescued }]),
  );

  const months = [];
  const cursor = new Date(since);
  for (let i = 0; i < 12; i += 1) {
    const year = cursor.getFullYear();
    const monthNum = cursor.getMonth() + 1;
    const key = `${year}-${monthNum}`;
    const entry = byKey.get(key) || { reports: 0, rescued: 0 };
    months.push({
      month: cursor.toLocaleString("en-US", { month: "short", year: "numeric" }),
      reports: entry.reports,
      rescued: entry.rescued,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return months;
}

export async function performance(match = {}) {
  const m = baseMatch(match);
  const [row] = await RescueReport.aggregate([
    { $match: m },
    {
      $addFields: {
        ...durationField("responseMins", "reportedAt", "assignedAt"),
        ...durationField("acceptanceMins", "assignedAt", "acceptedAt"),
        ...durationField("rescueDurationMins", "startedAt", "rescuedAt"),
        ...durationField("totalDurationMins", "reportedAt", "closedAt"),
      },
    },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $in: ["$status", COMPLETED_STATUSES] }, 1, 0] } },
        avgResponseMins: { $avg: "$responseMins" },
        avgAcceptanceMins: { $avg: "$acceptanceMins" },
        avgRescueDurationMins: { $avg: "$rescueDurationMins" },
        avgTotalDurationMins: { $avg: "$totalDurationMins" },
      },
    },
  ]);

  const total = row?.total || 0;
  const completed = row?.completed || 0;
  return {
    avgResponseMins: Math.round(row?.avgResponseMins || 0),
    avgAcceptanceMins: Math.round(row?.avgAcceptanceMins || 0),
    avgRescueDurationMins: Math.round(row?.avgRescueDurationMins || 0),
    avgTotalDurationMins: Math.round(row?.avgTotalDurationMins || 0),
    completionRate: total ? Math.round((completed / total) * 1000) / 10 : 0,
  };
}

export default {
  overview,
  reportsByAnimal,
  reportsByStatus,
  reportsByPriority,
  monthly,
  performance,
};
