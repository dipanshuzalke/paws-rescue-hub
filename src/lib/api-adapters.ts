import { STATUS_LABELS } from "@/data/mockReports";
import type {
  AnimalType,
  AppNotification,
  Condition,
  Emergency,
  NGO,
  NotificationKind,
  RescueReport,
  RescueStatus,
  Rescuer,
  Role,
  TimelineEntry,
  User,
  UserStatus,
} from "@/types";

/* ------------------------------------------------------------------ *
 * Backend DTOs (MongoDB documents serialised by the Express API)
 * ------------------------------------------------------------------ */

export interface ApiImage {
  url: string;
  publicId?: string;
}

export interface ApiUser {
  _id: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  role: "CITIZEN" | "RESCUER" | "NGO" | "ADMIN";
  status?: string;
  isActive?: boolean;
  isVerified?: boolean;
  profileImage?: ApiImage;
  location?: { coordinates?: number[]; address?: string };
  organization?: string | { _id: string; name: string };
  availability?: "AVAILABLE" | "BUSY" | "OFFLINE";
  activeCases?: number;
  completedCases?: number;
  avgResponseMins?: number;
  rating?: number;
  createdAt?: string;
}

export interface ApiHistoryEntry {
  _id: string;
  previousStatus?: string;
  newStatus: RescueStatus;
  note?: string;
  changedByName?: string;
  timestamp: string;
}

export interface ApiReport {
  _id: string;
  reportId: string;
  title?: string;
  animalType: "DOG" | "CAT" | "COW" | "BIRD" | "OTHER";
  animalCount: number;
  condition: string;
  emergencyLevel: Emergency;
  status: RescueStatus;
  description: string;
  images?: ApiImage[];
  rescueImages?: ApiImage[];
  address: string;
  area?: string;
  city?: string;
  location?: { coordinates?: number[] };
  reporter?: ApiUser | string;
  assignedRescuer?: ApiUser | string | null;
  assignedOrganization?: { _id: string; name: string } | string | null;
  reportedAt?: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  rescuedAt?: string;
  closedAt?: string;
  createdAt: string;
  updatedAt: string;
  totalDurationMins?: number | null;
  rescueNotes?: {
    _id: string;
    text: string;
    authorName?: string;
    authorRole?: string;
    at: string;
  }[];
  history?: ApiHistoryEntry[];
}

export interface ApiNotification {
  _id: string;
  title: string;
  message: string;
  type: string;
  emergencyLevel?: Emergency | null;
  isRead: boolean;
  link?: string;
  createdAt: string;
}

export interface ApiOrganization {
  _id: string;
  name: string;
  description?: string;
  email: string;
  phone: string;
  address?: string;
  contactPerson?: string;
  website?: string;
  verificationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive?: boolean;
  createdAt?: string;
  rescuerCount?: number;
  caseCount?: number;
}

/* ------------------------------------------------------------------ *
 * Enum mapping — API screaming case <-> Phase 1 UI labels
 * ------------------------------------------------------------------ */

const ANIMAL_TO_UI: Record<string, AnimalType> = {
  DOG: "Dog",
  CAT: "Cat",
  COW: "Cow",
  BIRD: "Bird",
  OTHER: "Other",
};

const CONDITION_TO_UI: Record<string, Condition> = {
  INJURED: "Injured",
  SICK: "Sick",
  ABANDONED: "Abandoned",
  TRAPPED: "Trapped",
  ACCIDENT: "Accident",
  STARVING: "Sick",
  OTHER: "Other",
};

export const toApiAnimal = (a: AnimalType) => a.toUpperCase();
export const toApiCondition = (c: Condition) => c.toUpperCase();
export const toUiRole = (r: string): Role => r.toLowerCase() as Role;
export const toApiRole = (r: Role) => r.toUpperCase();

function idOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  const obj = value as { _id?: string; id?: string };
  return obj._id ?? obj.id ?? "";
}

function isPopulated(value: unknown): value is ApiUser {
  return Boolean(value) && typeof value === "object" && "name" in (value as object);
}

/* ------------------------------------------------------------------ *
 * Adapters — keep the Phase 1 UI types untouched
 * ------------------------------------------------------------------ */

export function adaptUser(u: ApiUser): User {
  return {
    id: u._id ?? u.id ?? "",
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: toUiRole(u.role),
    status: ((u.status as UserStatus) ?? (u.isActive === false ? "INACTIVE" : "ACTIVE")) as UserStatus,
    location: u.location?.address ?? "Nagpur",
    joinedAt: (u.createdAt ?? new Date().toISOString()).slice(0, 10),
    avatar: u.profileImage?.url,
    cases: (u.completedCases ?? 0) + (u.activeCases ?? 0),
    organization:
      typeof u.organization === "object" && u.organization ? u.organization.name : undefined,
  };
}

export function adaptRescuer(u: ApiUser): Rescuer {
  const base = adaptUser(u);
  const coords = u.location?.coordinates;
  return {
    ...base,
    role: "rescuer",
    availability:
      u.availability === "AVAILABLE" ? "Available" : u.availability === "BUSY" ? "Busy" : "Offline",
    distanceKm: 0,
    activeCases: u.activeCases ?? 0,
    completedCases: u.completedCases ?? 0,
    avgResponseMins: u.avgResponseMins ?? 0,
    rating: u.rating ?? 5,
    ngoId: idOf(u.organization),
    coords: { lat: coords?.[1] ?? 21.1458, lng: coords?.[0] ?? 79.0882 },
  };
}

function adaptTimeline(report: ApiReport): TimelineEntry[] {
  if (report.history?.length) {
    return report.history.map((h) => ({
      status: h.newStatus,
      label: STATUS_LABELS[h.newStatus] ?? h.newStatus,
      at: h.timestamp,
      by: h.changedByName,
      note: h.note || undefined,
    }));
  }
  // Fall back to the report's own timestamps when history is not populated.
  const steps: [RescueStatus, string | undefined][] = [
    ["REPORTED", report.reportedAt ?? report.createdAt],
    ["ASSIGNED", report.assignedAt],
    ["ACCEPTED", report.acceptedAt],
    ["IN_PROGRESS", report.startedAt],
    ["RESCUED", report.rescuedAt],
    ["CLOSED", report.closedAt],
  ];
  return steps.map(([status, at]) => ({
    status,
    label: STATUS_LABELS[status],
    at: at ?? null,
  }));
}

export function adaptReport(r: ApiReport): RescueReport {
  const reporter = isPopulated(r.reporter) ? r.reporter : undefined;
  const rescuer = isPopulated(r.assignedRescuer) ? r.assignedRescuer : undefined;
  const org =
    r.assignedOrganization && typeof r.assignedOrganization === "object"
      ? r.assignedOrganization
      : undefined;
  const coords = r.location?.coordinates;
  const animal = ANIMAL_TO_UI[r.animalType] ?? "Other";
  const condition = CONDITION_TO_UI[r.condition] ?? "Other";

  return {
    id: r._id,
    animal,
    count: r.animalCount ?? 1,
    condition,
    emergency: r.emergencyLevel,
    status: r.status,
    title: r.title || `${condition} ${animal}`,
    description: r.description,
    images: [...(r.images ?? []), ...(r.rescueImages ?? [])].map((i) => i.url),
    address: r.address,
    area: r.area ?? "",
    city: r.city ?? "Nagpur",
    coords: { lat: coords?.[1] ?? 21.1458, lng: coords?.[0] ?? 79.0882 },
    distanceKm: 0,
    reporterId: idOf(r.reporter),
    reporterName: reporter?.name ?? "Citizen",
    reporterPhone: reporter?.phone ?? "",
    rescuerId: rescuer ? idOf(r.assignedRescuer) : undefined,
    rescuerName: rescuer?.name,
    ngoId: org?._id,
    ngoName: org?.name,
    createdAt: r.reportedAt ?? r.createdAt,
    updatedAt: r.updatedAt,
    closedAt: r.closedAt,
    durationMins: r.totalDurationMins ?? undefined,
    timeline: adaptTimeline(r),
    notes: (r.rescueNotes ?? []).map((n) => ({
      id: n._id,
      author: n.authorName ?? "Rescue team",
      role: toUiRole(n.authorRole ?? "RESCUER"),
      at: n.at,
      text: n.text,
    })),
  };
}

const NOTIFICATION_KIND: Record<string, NotificationKind> = {
  NEW_REPORT: "rescue",
  ASSIGNMENT: "assignment",
  STATUS_UPDATE: "rescue",
  RESCUE_ACCEPTED: "rescue",
  RESCUE_STARTED: "rescue",
  RESCUE_COMPLETED: "rescue",
  SYSTEM: "system",
};

export function adaptNotification(n: ApiNotification, role: Role | "all" = "all"): AppNotification {
  return {
    id: n._id,
    title: n.title,
    body: n.message,
    kind: NOTIFICATION_KIND[n.type] ?? "system",
    emergency: n.emergencyLevel ?? undefined,
    at: n.createdAt,
    read: n.isRead,
    role,
    link: n.link || undefined,
  };
}

export function adaptOrganization(o: ApiOrganization): NGO {
  return {
    id: o._id,
    name: o.name,
    location: o.address ?? "Nagpur",
    contactPerson: o.contactPerson ?? "—",
    email: o.email,
    phone: o.phone,
    rescuers: o.rescuerCount ?? 0,
    cases: o.caseCount ?? 0,
    verification: o.verificationStatus,
    status: o.isActive === false ? "INACTIVE" : "ACTIVE",
    joinedAt: (o.createdAt ?? new Date().toISOString()).slice(0, 10),
    about: o.description ?? "",
  };
}
