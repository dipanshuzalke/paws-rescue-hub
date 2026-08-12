import mongoose from "mongoose";
import {
  ANIMAL_TYPES,
  CONDITIONS,
  EMERGENCY_LEVELS,
  REPORT_STATUSES,
} from "../utils/constants.js";
import { generateReportId } from "../utils/generateId.js";

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String,
    width: Number,
    height: Number,
    format: String,
    bytes: Number,
  },
  { _id: false },
);

const noteSchema = new mongoose.Schema(
  {
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    authorName: String,
    authorRole: String,
    text: { type: String, required: true, maxlength: 2000 },
    at: { type: Date, default: Date.now },
  },
  { _id: true },
);

const rescueReportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true, index: true, default: generateReportId },
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, trim: true, maxlength: 200, default: "" },
    animalType: { type: String, enum: ANIMAL_TYPES, required: true, index: true },
    animalCount: { type: Number, default: 1, min: 1, max: 100 },
    condition: { type: String, enum: CONDITIONS, required: true, index: true },
    emergencyLevel: { type: String, enum: EMERGENCY_LEVELS, required: true, index: true },
    description: { type: String, required: true, trim: true, minlength: 10, maxlength: 4000 },
    images: { type: [imageSchema], default: [] },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      // [longitude, latitude]
      coordinates: { type: [Number], required: true },
    },
    address: { type: String, required: true, trim: true },
    area: { type: String, trim: true, default: "" },
    city: { type: String, trim: true, default: "Nagpur" },
    status: { type: String, enum: REPORT_STATUSES, default: "REPORTED", index: true },
    assignedRescuer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    assignedOrganization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
      index: true,
    },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "RescueAssignment", default: null },
    reportedAt: { type: Date, default: Date.now, index: true },
    assignedAt: Date,
    acceptedAt: Date,
    startedAt: Date,
    rescuedAt: Date,
    closedAt: Date,
    cancelledReason: String,
    rescueNotes: { type: [noteSchema], default: [] },
    rescueImages: { type: [imageSchema], default: [] },
    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

rescueReportSchema.index({ location: "2dsphere" });
rescueReportSchema.index({ createdAt: -1 });
rescueReportSchema.index({ status: 1, emergencyLevel: 1 });
rescueReportSchema.index({ description: "text", address: "text", title: "text" });

// Derived durations in minutes — used directly by the analytics endpoints.
rescueReportSchema.virtual("responseMins").get(function v() {
  return diffMins(this.reportedAt, this.assignedAt);
});
rescueReportSchema.virtual("acceptanceMins").get(function v() {
  return diffMins(this.assignedAt, this.acceptedAt);
});
rescueReportSchema.virtual("rescueDurationMins").get(function v() {
  return diffMins(this.startedAt, this.rescuedAt);
});
rescueReportSchema.virtual("totalDurationMins").get(function v() {
  return diffMins(this.reportedAt, this.closedAt);
});

function diffMins(a, b) {
  if (!a || !b) return null;
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 60000));
}

export const RescueReport = mongoose.model("RescueReport", rescueReportSchema);
