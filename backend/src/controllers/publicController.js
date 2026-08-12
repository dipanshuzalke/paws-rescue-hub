import { RescueReport } from "../models/RescueReport.js";
import { Organization } from "../models/Organization.js";
import { asyncHandler, ApiError } from "../utils/apiError.js";
import { ok, list, buildPagination, parseQueryOptions } from "../utils/apiResponse.js";

const PUBLIC_STATUSES = ["RESCUED", "CLOSED", "IN_PROGRESS", "ACCEPTED"];

// Only ever project these fields for the public gallery — never reporter PII.
const PUBLIC_PROJECTION = {
  reportId: 1,
  animalType: 1,
  animalCount: 1,
  condition: 1,
  emergencyLevel: 1,
  description: 1,
  images: 1,
  area: 1,
  city: 1,
  status: 1,
  reportedAt: 1,
  rescuedAt: 1,
  assignedOrganization: 1,
  assignedRescuer: 1,
};

function shapeCase(report) {
  const obj = typeof report.toObject === "function" ? report.toObject() : report;
  return {
    reportId: obj.reportId,
    animalType: obj.animalType,
    animalCount: obj.animalCount,
    condition: obj.condition,
    emergencyLevel: obj.emergencyLevel,
    description: obj.description,
    images: obj.images,
    area: obj.area,
    city: obj.city,
    status: obj.status,
    reportedAt: obj.reportedAt,
    rescuedAt: obj.rescuedAt,
    organization: obj.assignedOrganization ? { name: obj.assignedOrganization.name } : null,
    rescuer: obj.assignedRescuer ? { firstName: (obj.assignedRescuer.name || "").split(" ")[0] } : null,
  };
}

export const getRescueCases = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "reportedAt" });
  const filter = { isPublic: true, status: { $in: PUBLIC_STATUSES } };
  if (req.query.animalType) filter.animalType = req.query.animalType;
  if (req.query.city) filter.city = req.query.city;

  const [items, total] = await Promise.all([
    RescueReport.find(filter, PUBLIC_PROJECTION)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("assignedOrganization", "name")
      .populate("assignedRescuer", "name"),
    RescueReport.countDocuments(filter),
  ]);

  return list(res, items.map(shapeCase), buildPagination({ page, limit, total }));
});

export const getRescueCaseById = asyncHandler(async (req, res) => {
  const report = await RescueReport.findOne(
    { reportId: req.params.reportId, isPublic: true, status: { $in: PUBLIC_STATUSES } },
    PUBLIC_PROJECTION,
  )
    .populate("assignedOrganization", "name")
    .populate("assignedRescuer", "name");

  if (!report) throw ApiError.notFound("Rescue case not found");
  return ok(res, shapeCase(report));
});

export const getPublicStats = asyncHandler(async (_req, res) => {
  const [totalReports, totalRescued, organizations, rescuers] = await Promise.all([
    RescueReport.countDocuments({}),
    RescueReport.countDocuments({ status: { $in: ["RESCUED", "CLOSED"] } }),
    Organization.countDocuments({ verificationStatus: "VERIFIED", isActive: true }),
    RescueReport.distinct("assignedRescuer", { assignedRescuer: { $ne: null } }),
  ]);

  return ok(res, {
    totalReports,
    totalRescued,
    organizations,
    activeRescuers: rescuers.length,
  });
});

export const getPublicOrganizations = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "name" });
  const filter = { verificationStatus: "VERIFIED", isActive: true };
  if (req.query.search) {
    filter.$text = { $search: req.query.search };
  }

  const projection = {
    name: 1,
    description: 1,
    logo: 1,
    website: 1,
    address: 1,
    location: 1,
    email: 1,
    phone: 1,
  };

  const [items, total] = await Promise.all([
    Organization.find(filter, projection).sort(sort).skip(skip).limit(limit),
    Organization.countDocuments(filter),
  ]);

  return list(res, items, buildPagination({ page, limit, total }));
});
