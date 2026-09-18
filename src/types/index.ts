export type Role = "citizen" | "rescuer" | "ngo" | "admin";

export type RescueStatus =
  | "REPORTED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "IN_PROGRESS"
  | "RESCUED"
  | "CLOSED"
  | "CANCELLED";

export type Emergency = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type UserStatus = "ACTIVE" | "INACTIVE" | "PENDING" | "VERIFIED" | "REJECTED";

export type AnimalType = string;

export type Condition =
  | "Injured"
  | "Sick"
  | "Abandoned"
  | "Trapped"
  | "Accident"
  | "Other";

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  location: string;
  vehicle?: string;
  bio?: string;
  joinedAt: string;
  avatar?: string | undefined;
  cases: number;
  organization?: string | undefined;
  availability?: "Available" | "Busy" | "Offline";
  isOnline?: boolean;
}

export interface Rescuer extends User {
  role: "rescuer";
  availability: "Available" | "Busy" | "Offline";
  distanceKm: number;
  vehicle?: string;
  bio?: string;
  activeCases: number;
  completedCases: number;
  avgResponseMins: number;
  rating: number;
  ngoId: string;
  coords: GeoPoint;
  isOnline?: boolean;
}

export interface NGO {
  id: string;
  name: string;
  registrationNumber?: string | undefined;
  location: string;
  contactPerson: string;
  areasServed?: string | undefined;
  email: string;
  phone: string;
  rescuers: number;
  cases: number;
  verification: "VERIFIED" | "PENDING" | "REJECTED";
  status: UserStatus;
  joinedAt: string;
  about: string;
  isOnline?: boolean;
}

export interface TimelineEntry {
  status: RescueStatus;
  label: string;
  at: string | null;
  by?: string | undefined;
  note?: string | undefined;
}

export interface RescueNote {
  id: string;
  author: string;
  role: Role;
  at: string;
  text: string;
}

export interface RescueReport {
  id: string;
  animal: AnimalType;
  count: number;
  condition: Condition;
  emergency: Emergency;
  status: RescueStatus;
  title: string;
  description: string;
  images: string[];
  address: string;
  area: string;
  city: string;
  coords: GeoPoint;
  distanceKm: number;
  reporterId: string;
  reporterName: string;
  reporterPhone: string;
  rescuerId?: string | undefined;
  rescuerName?: string | undefined;
  rescuerPhone?: string | undefined;
  ngoId?: string | undefined;
  ngoName?: string | undefined;
  createdAt: string;
  updatedAt: string;
  rescuedAt?: string | undefined;
  closedAt?: string | undefined;
  durationMins?: number | undefined;
  timeline: TimelineEntry[];
  notes: RescueNote[];
  /** Phase 3 — rescue evidence & verification. */
  evidence?: RescueEvidence | undefined;
  /** Phase 3 — set when this report was linked to an existing case. */
  duplicateOfId?: string | undefined;
}

export type EvidenceStatus = "NONE" | "PENDING" | "VERIFIED" | "REJECTED";

export interface EvidenceEvent {
  action: string;
  byName?: string | undefined;
  byRole?: string | undefined;
  notes?: string | undefined;
  photos: string[];
  at: string;
}

export interface RescueEvidence {
  status: EvidenceStatus;
  photos: string[];
  notes: string;
  animalCondition: string;
  treatmentNotes: string;
  completionCoords?: GeoPoint | undefined;
  submittedByName?: string | undefined;
  submittedAt?: string | undefined;
  rescuerRating?: number | undefined;
  rescuerRatedAt?: string | undefined;
  submissionCount: number;
  verifiedByName?: string | undefined;
  verifiedAt?: string | undefined;
  verificationNotes: string;
  rejectionReason: string;
  events: EvidenceEvent[];
}

export type DuplicateConfidence = "HIGH" | "POSSIBLE" | "LOW";

export interface DuplicateMatch {
  id: string;
  reportId: string;
  animal: AnimalType;
  count: number;
  condition: string;
  emergency: Emergency;
  status: RescueStatus;
  description: string;
  address: string;
  area: string;
  city: string;
  images: string[];
  distanceMeters: number;
  minutesAgo: number;
  createdAt: string;
  score: number;
  confidence: DuplicateConfidence;
  reasons: string[];
}

export interface DuplicateCheckResult {
  hasDuplicates: boolean;
  radiusMeters: number;
  windowHours: number;
  matches: DuplicateMatch[];
}


export type NotificationKind = "rescue" | "system" | "assignment";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  kind: NotificationKind;
  emergency?: Emergency | undefined;
  at: string;
  read: boolean;
  role: Role | "all";
  link?: string | undefined;
}

export interface ActivityEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  target: string;
  kind: "report" | "assign" | "accept" | "rescue" | "user" | "ngo";
}
