import mongoose from "mongoose";
import { ASSIGNMENT_STATUSES } from "../utils/constants.js";

const rescueAssignmentSchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: "RescueReport", required: true, index: true },
    rescuer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: { type: String, enum: ASSIGNMENT_STATUSES, default: "ASSIGNED", index: true },
    assignedAt: { type: Date, default: Date.now },
    acceptedAt: Date,
    startedAt: Date,
    completedAt: Date,
    rejectedAt: Date,
    notes: { type: String, default: "", maxlength: 2000 },
  },
  { timestamps: true },
);

rescueAssignmentSchema.index({ report: 1, rescuer: 1, status: 1 });

export const RescueAssignment = mongoose.model("RescueAssignment", rescueAssignmentSchema);
