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

export type AnimalType = "Dog" | "Cat" | "Cow" | "Bird" | "Other";

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
  joinedAt: string;
  avatar?: string | undefined;
  cases: number;
  organization?: string | undefined;
}

export interface Rescuer extends User {
  role: "rescuer";
  availability: "Available" | "Busy" | "Offline";
  distanceKm: number;
  activeCases: number;
  completedCases: number;
  avgResponseMins: number;
  rating: number;
  ngoId: string;
  coords: GeoPoint;
}

export interface NGO {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  email: string;
  phone: string;
  rescuers: number;
  cases: number;
  verification: "VERIFIED" | "PENDING" | "REJECTED";
  status: UserStatus;
  joinedAt: string;
  about: string;
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
  ngoId?: string | undefined;
  ngoName?: string | undefined;
  createdAt: string;
  updatedAt: string;
  closedAt?: string | undefined;
  durationMins?: number | undefined;
  timeline: TimelineEntry[];
  notes: RescueNote[];
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