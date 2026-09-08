import mongoose from "mongoose";
import { RescueReport } from "../models/RescueReport.js";
import { env } from "../config/env.js";
import { ACTIVE_REPORT_STATUSES } from "../utils/constants.js";

/**
 * Explainable duplicate scoring.
 *
 *  Location proximity   0 - 45  (linear decay across the configured radius)
 *  Animal type match       35   (mismatch scores 0 — the strongest signal)
 *  Time proximity       0 - 15  (linear decay across the configured window)
 *  Condition match          5
 *
 *  A candidate is returned only when every duplicate signal matches. The
 *  score remains useful for explaining confidence, but no single signal can
 *  trigger a duplicate warning by itself.
 */
const WEIGHTS = { distance: 45, animal: 35, time: 15, condition: 5 };

function scoreCandidate({ distanceMeters, sameAnimal, ageHours, sameCondition }, cfg) {
  const distanceScore = WEIGHTS.distance * Math.max(0, 1 - distanceMeters / cfg.radiusMeters);
  const animalScore = sameAnimal ? WEIGHTS.animal : 0;
  const timeScore = WEIGHTS.time * Math.max(0, 1 - ageHours / cfg.windowHours);
  const conditionScore = sameCondition ? WEIGHTS.condition : 0;
  return Math.round(distanceScore + animalScore + timeScore + conditionScore);
}

export function confidenceFor(score) {
  if (score >= 75) return "HIGH";
  if (score >= 50) return "POSSIBLE";
  return "LOW";
}

/**
 * Finds nearby, recent, still-active reports that may describe the same animal.
 * Uses the existing 2dsphere index via $geoNear — no in-process distance maths.
 */
export async function findDuplicateCandidates({
  animalType,
  latitude,
  longitude,
  condition,
  excludeReportId,
  radiusMeters,
  windowHours,
  minScore,
  limit = 10,
} = {}) {
  const cfg = {
    radiusMeters: Number(radiusMeters) || env.duplicates.radiusMeters,
    windowHours: Number(windowHours) || env.duplicates.windowHours,
  };
  const threshold = minScore === undefined ? env.duplicates.minScore : Number(minScore);
  const since = new Date(Date.now() - cfg.windowHours * 60 * 60 * 1000);

  const query = {
    status: { $in: ACTIVE_REPORT_STATUSES },
    reportedAt: { $gte: since },
    duplicateOf: null,
  };
  if (excludeReportId && mongoose.isValidObjectId(excludeReportId)) {
    query._id = { $ne: new mongoose.Types.ObjectId(String(excludeReportId)) };
  }

  const rows = await RescueReport.aggregate([
    {
      $geoNear: {
        near: { type: "Point", coordinates: [Number(longitude), Number(latitude)] },
        distanceField: "distanceMeters",
        maxDistance: cfg.radiusMeters,
        spherical: true,
        query,
      },
    },
    { $limit: 40 },
    {
      $project: {
        reportId: 1,
        animalType: 1,
        animalCount: 1,
        condition: 1,
        emergencyLevel: 1,
        status: 1,
        description: 1,
        address: 1,
        area: 1,
        city: 1,
        images: { $slice: [{ $ifNull: ["$images", []] }, 3] },
        location: 1,
        reportedAt: 1,
        createdAt: 1,
        distanceMeters: 1,
      },
    },
  ]);

  const now = Date.now();
  const matches = rows
    .map((r) => {
      const ageHours = Math.max(
        0,
        (now - new Date(r.reportedAt || r.createdAt).getTime()) / (60 * 60 * 1000),
      );
      const sameAnimal = String(r.animalType) === String(animalType);
      const sameCondition = Boolean(condition) && String(r.condition) === String(condition);
      const distanceMeters = Math.round(r.distanceMeters);
      const score = scoreCandidate({ distanceMeters, sameAnimal, ageHours, sameCondition }, cfg);
      const coords = r.location?.coordinates || [];
      return {
        id: String(r._id),
        reportId: r.reportId,
        animalType: r.animalType,
        animalCount: r.animalCount,
        condition: r.condition,
        emergencyLevel: r.emergencyLevel,
        status: r.status,
        description: r.description,
        address: r.address,
        area: r.area,
        city: r.city,
        images: (r.images || []).map((i) => ({ url: i.url })),
        distanceMeters,
        minutesAgo: Math.round(ageHours * 60),
        createdAt: r.reportedAt || r.createdAt,
        location: { latitude: coords[1] ?? null, longitude: coords[0] ?? null },
        score,
        confidence: confidenceFor(score),
        reasons: [
          `${distanceMeters} m away`,
          sameAnimal ? "Same animal type" : "Different animal type",
          `Reported ${Math.round(ageHours * 60)} min ago`,
          ...(sameCondition ? ["Same reported condition"] : []),
        ],
      };
    })
    .filter(
      (m) =>
        m.score >= threshold &&
        m.reasons.includes("Same animal type") &&
        m.reasons.includes("Same reported condition") &&
        m.distanceMeters <= cfg.radiusMeters &&
        m.minutesAgo <= cfg.windowHours * 60,
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return {
    hasDuplicates: matches.length > 0,
    radiusMeters: cfg.radiusMeters,
    windowHours: cfg.windowHours,
    matches,
  };
}

/** Duplicate candidates for an existing report (NGO/Admin operational view). */
export async function findDuplicatesForReport(report, options = {}) {
  const coords = report.location?.coordinates || [];
  return findDuplicateCandidates({
    animalType: report.animalType,
    longitude: coords[0],
    latitude: coords[1],
    condition: report.condition,
    excludeReportId: report._id,
    ...options,
  });
}
