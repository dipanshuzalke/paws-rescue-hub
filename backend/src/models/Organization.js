import mongoose from "mongoose";
import { VERIFICATION_STATUSES } from "../utils/constants.js";

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    // GeoJSON order: [longitude, latitude]
    coordinates: { type: [Number], default: undefined },
    address: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, maxlength: 160 },
    registrationNumber: { type: String, trim: true, default: "", maxlength: 120 },
    description: { type: String, trim: true, default: "", maxlength: 2000 },
    email: { type: String, required: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    address: { type: String, trim: true, default: "" },
    location: { type: pointSchema, default: undefined },
    logo: { url: String, publicId: String },
    website: { type: String, trim: true, default: "" },
    contactPerson: { type: String, trim: true, default: "" },
    areasServed: { type: String, trim: true, default: "", maxlength: 500 },
    verificationStatus: { type: String, enum: VERIFICATION_STATUSES, default: "PENDING", index: true },
    isActive: { type: Boolean, default: true },
    lastSeenAt: { type: Date, default: null, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true },
);

organizationSchema.index({ location: "2dsphere" });
organizationSchema.index({ name: "text", address: "text" });

export const Organization = mongoose.model("Organization", organizationSchema);
