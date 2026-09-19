import mongoose from "mongoose";
import { NOTIFICATION_TYPES } from "../utils/constants.js";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    report: { type: mongoose.Schema.Types.ObjectId, ref: "RescueReport", default: null },
    type: { type: String, enum: NOTIFICATION_TYPES, default: "SYSTEM", index: true },
    title: { type: String, required: true, maxlength: 200 },
    message: { type: String, required: true, maxlength: 1000 },
    emergencyLevel: { type: String, default: null },
    link: { type: String, default: "" },
    isRead: { type: Boolean, default: false, index: true },
    dedupeKey: { type: String, default: null, index: true },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, dedupeKey: 1 }, { unique: true, sparse: true });

export const Notification = mongoose.model("Notification", notificationSchema);
