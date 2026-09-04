export const ROLES = ["CITIZEN", "RESCUER", "NGO", "ADMIN"];
export const PUBLIC_ROLES = ["CITIZEN", "RESCUER", "NGO"];
export const USER_STATUS = ["ACTIVE", "INACTIVE", "PENDING", "SUSPENDED"];
export const AVAILABILITY = ["AVAILABLE", "BUSY", "OFFLINE"];

export const ANIMAL_TYPES = ["DOG", "CAT", "COW", "BIRD", "OTHER"];
export const CONDITIONS = ["INJURED", "SICK", "ABANDONED", "TRAPPED", "ACCIDENT", "STARVING", "OTHER"];
export const EMERGENCY_LEVELS = ["CRITICAL", "HIGH", "MEDIUM", "LOW"];
export const REPORT_STATUSES = [
  "REPORTED",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "RESCUED",
  "CLOSED",
  "CANCELLED",
];
export const ASSIGNMENT_STATUSES = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS", "COMPLETED", "REJECTED"];
export const VERIFICATION_STATUSES = ["PENDING", "VERIFIED", "REJECTED"];

/** Statuses considered "still live" — used by duplicate detection. */
export const ACTIVE_REPORT_STATUSES = ["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS"];

/** Evidence verification lifecycle (NONE = no evidence submitted yet). */
export const EVIDENCE_STATUSES = ["NONE", "PENDING", "VERIFIED", "REJECTED"];

/** Non status-change audit actions recorded on RescueHistory. */
export const HISTORY_ACTIONS = [
  "STATUS_CHANGE",
  "RESCUE_EVIDENCE_SUBMITTED",
  "RESCUE_EVIDENCE_RESUBMITTED",
  "RESCUE_EVIDENCE_VERIFIED",
  "RESCUE_EVIDENCE_REJECTED",
  "DUPLICATE_MARKED",
  "DUPLICATE_DISMISSED",
];

export const DUPLICATE_CONFIDENCE = ["HIGH", "POSSIBLE", "LOW"];
export const NOTIFICATION_TYPES = [
  "NEW_REPORT",
  "ASSIGNMENT",
  "STATUS_UPDATE",
  "RESCUE_ACCEPTED",
  "RESCUE_STARTED",
  "RESCUE_COMPLETED",
  "EVIDENCE_SUBMITTED",
  "EVIDENCE_VERIFIED",
  "EVIDENCE_REJECTED",
  "DUPLICATE_FLAGGED",
  "SYSTEM",
];

/** Allowed rescue-report status transitions. Anything else is rejected with 409. */
export const STATUS_TRANSITIONS = {
  REPORTED: ["ASSIGNED", "CANCELLED"],
  ASSIGNED: ["ACCEPTED", "REPORTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESCUED", "CANCELLED"],
  RESCUED: ["CLOSED"],
  CLOSED: [],
  CANCELLED: [],
};

export const STATUS_TIMESTAMP_FIELD = {
  REPORTED: "reportedAt",
  ASSIGNED: "assignedAt",
  ACCEPTED: "acceptedAt",
  IN_PROGRESS: "startedAt",
  RESCUED: "rescuedAt",
  CLOSED: "closedAt",
  CANCELLED: "closedAt",
};

export function canTransition(from, to) {
  return Boolean(STATUS_TRANSITIONS[from]?.includes(to));
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_IMAGES = 5;
export const MAX_EVIDENCE_IMAGES = 6;
export const MIN_EVIDENCE_IMAGES = 1;
