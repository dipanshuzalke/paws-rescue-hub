import { asyncHandler } from "../utils/apiError.js";
import { ok } from "../utils/apiResponse.js";
import * as analyticsService from "../services/analyticsService.js";

/** Builds the mongo match scope for the caller based on their role. */
function scopeFor(user) {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "NGO":
      // NGO operations include both their assigned cases and the shared
      // unassigned queue shown on the NGO requests/dashboard pages.
      return {
        $or: [{ assignedOrganization: null }, { assignedOrganization: user.organization }],
      };
    case "RESCUER":
      return { assignedRescuer: user._id };
    case "CITIZEN":
    default:
      return { reporter: user._id };
  }
}

export const getOverview = asyncHandler(async (req, res) => {
  const data = await analyticsService.overview(scopeFor(req.user));
  return ok(res, data);
});

export const getReportsByAnimal = asyncHandler(async (req, res) => {
  const data = await analyticsService.reportsByAnimal(scopeFor(req.user));
  return ok(res, data);
});

export const getReportsByStatus = asyncHandler(async (req, res) => {
  const data = await analyticsService.reportsByStatus(scopeFor(req.user));
  return ok(res, data);
});

export const getReportsByPriority = asyncHandler(async (req, res) => {
  const data = await analyticsService.reportsByPriority(scopeFor(req.user));
  return ok(res, data);
});

export const getMonthly = asyncHandler(async (req, res) => {
  const data = await analyticsService.monthly(scopeFor(req.user));
  return ok(res, data);
});

export const getPerformance = asyncHandler(async (req, res) => {
  const data = await analyticsService.performance(scopeFor(req.user));
  return ok(res, data);
});

export const getResponseTimeTrend = asyncHandler(async (req, res) => {
  const data = await analyticsService.responseTimeTrend(scopeFor(req.user));
  return ok(res, data);
});
