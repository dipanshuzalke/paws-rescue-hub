import { z } from "zod";
import {
  PUBLIC_ROLES,
  CONDITIONS,
  EMERGENCY_LEVELS,
  REPORT_STATUSES,
} from "./constants.js";

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  email: z.string().trim().email("A valid email is required"),
  phone: z.string().trim().min(1, "Phone is required").max(24),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(PUBLIC_ROLES).optional().default("CITIZEN"),
  organizationName: z.string().trim().min(1).max(160).optional(),
  organizationDescription: z.string().trim().max(2000).optional(),
  organizationRegNumber: z.string().trim().max(120).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("A valid email is required"),
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().length(64, "Invalid reset link"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
});

export const updateProfileSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),

    email: z
      .string()
      .trim()
      .email("A valid email is required")
      .optional(),

    phone: z.string().trim().min(1).max(24).optional(),

    vehicle: z
      .string()
      .trim()
      .max(100)
      .optional(),

    bio: z
      .string()
      .trim()
      .max(500)
      .optional(),

    availability: z
      .enum(["AVAILABLE", "BUSY", "OFFLINE"])
      .optional(),

    location: z
      .object({
        address: z.string().trim().max(200).optional(),

        coordinates: z
          .tuple([
            z.number().min(-180).max(180),
            z.number().min(-90).max(90),
          ])
          .optional(),
      })
      .optional(),
  })
  .partial();

export const updateOrganizationProfileSchema = z.object({
  name: z.string().trim().min(1).max(160).optional(),
  registrationNumber: z.string().trim().max(120).optional(),
  description: z.string().trim().max(2000).optional(),
  email: z.string().trim().email().optional(),
  phone: z.string().trim().min(1).max(24).optional(),
  contactPerson: z.string().trim().max(120).optional(),
  areasServed: z.string().trim().max(500).optional(),
});

const numberFromAny = (schema) =>
  z.preprocess((v) => (typeof v === "string" ? Number(v) : v), schema);

export const createReportSchema = z.object({
  animalType: z.string().trim().min(1, "Animal type is required").max(50),
  animalCount: numberFromAny(z.number().int().min(1).max(100)).optional().default(1),
  condition: z.enum(CONDITIONS),
  emergencyLevel: z.enum(EMERGENCY_LEVELS),
  description: z.string().trim().max(4000).optional().default(""),
  contactPhone: z.string().trim().min(1, "Contact number is required"),
  address: z.string().trim().min(1, "Address is required"),
  area: z.string().trim().optional().default(""),
  city: z.string().trim().optional().default("Nagpur"),
  latitude: numberFromAny(z.number().min(-90).max(90)),
  longitude: numberFromAny(z.number().min(-180).max(180)),
  title: z.string().trim().max(200).optional().default(""),
  duplicateWarningShown: z.preprocess((v) => v === true || v === "true", z.boolean()).optional(),
  duplicateOverride: z.preprocess((v) => v === true || v === "true", z.boolean()).optional(),
});

export const updateReportSchema = createReportSchema.partial();

export const statusUpdateSchema = z.object({
  status: z.enum(REPORT_STATUSES),
  note: z.string().trim().max(1000).optional().default(""),
});

export const rejectAssignmentSchema = z.object({
  reason: z.string().trim().max(2000).optional().default(""),
});

export const noteSchema = z.object({
  text: z.string().trim().min(1, "Note text is required").max(2000),
});

export const assignmentSchema = z.object({
  reportId: z.string().min(1),
  rescuerId: z.string().min(1),
  notes: z.string().trim().max(2000).optional().default(""),
});

export const reportQuerySchema = z.object({
  search: z.string().trim().optional(),
  animalType: z.string().trim().min(1).max(50).optional(),
  condition: z.enum(CONDITIONS).optional(),
  emergencyLevel: z.enum(EMERGENCY_LEVELS).optional(),
  status: z.enum(REPORT_STATUSES).optional(),
  city: z.string().trim().optional(),
  assignedRescuer: z.string().trim().optional(),
  dateFrom: z.string().trim().optional(),
  dateTo: z.string().trim().optional(),
  page: z.string().trim().optional(),
  limit: z.string().trim().optional(),
  sortBy: z.string().trim().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/* ------------------------------------------------------------------ *
 * Phase 3 — duplicate detection
 * ------------------------------------------------------------------ */

export const checkDuplicatesSchema = z.object({
  animalType: z.string().trim().min(1, "Animal type is required").max(50),
  latitude: numberFromAny(z.number().min(-90).max(90)),
  longitude: numberFromAny(z.number().min(-180).max(180)),
  condition: z.enum(CONDITIONS).optional(),
  radiusMeters: numberFromAny(z.number().int().min(50).max(20000)).optional(),
  windowHours: numberFromAny(z.number().int().min(1).max(720)).optional(),
});

export const markDuplicateSchema = z.object({
  primaryReportId: z.string().trim().min(1, "A primary report is required"),
  note: z.string().trim().max(1000).optional().default(""),
});

export const keepSeparateSchema = z.object({
  note: z.string().trim().max(1000).optional().default(""),
});

/* ------------------------------------------------------------------ *
 * Phase 3 — rescue evidence & verification
 * ------------------------------------------------------------------ */

export const evidenceSubmitSchema = z.object({
  notes: z.string().trim().min(5, "Please describe how the rescue was completed").max(2000),
  animalCondition: z.string().trim().max(200).optional().default(""),
  treatmentNotes: z.string().trim().max(2000).optional().default(""),
  latitude: numberFromAny(z.number().min(-90).max(90)).optional(),
  longitude: numberFromAny(z.number().min(-180).max(180)).optional(),
  confirmed: z
    .preprocess((v) => v === true || v === "true", z.boolean())
    .refine((v) => v === true, "You must confirm the rescue was completed"),
});

export const evidenceVerifySchema = z.object({
  notes: z.string().trim().max(2000).optional().default(""),
  rescuerRating: numberFromAny(z.number().int().min(1).max(5)).optional(),
  close: z.preprocess((v) => (v === undefined ? true : v === true || v === "true"), z.boolean()).optional(),
});

export const evidenceRejectSchema = z.object({
  reason: z.string().trim().min(5, "A rejection reason is required").max(2000),
});
