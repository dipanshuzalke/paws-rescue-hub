import mongoose from "mongoose";
import { REPORT_STATUSES, HISTORY_ACTIONS } from "../utils/constants.js";

const rescueHistorySchema = new mongoose.Schema(
  {
    report: { type: mongoose.Schema.Types.ObjectId, ref: "RescueReport", required: true, index: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    changedByName: String,
    changedByRole: String,
    action: { type: String, enum: HISTORY_ACTIONS, default: "STATUS_CHANGE", index: true },
    previousStatus: { type: String, enum: [...REPORT_STATUSES, "NONE"], default: "NONE" },
    newStatus: {
      type: String,
      enum: [...REPORT_STATUSES, "NONE"],
      default: "NONE",
      required() {
        return this.action === "STATUS_CHANGE";
      },
    },
    note: { type: String, default: "", maxlength: 1000 },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true },
);

export const RescueHistory = mongoose.model("RescueHistory", rescueHistorySchema);
