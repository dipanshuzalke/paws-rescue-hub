import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, USER_STATUS, AVAILABILITY } from "../utils/constants.js";

const pointSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["Point"], default: "Point" },
    // GeoJSON order: [longitude, latitude]
    coordinates: { type: [Number], default: undefined },
    address: { type: String, trim: true, default: "" },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, "Name is required"], trim: true, maxlength: 120 },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "A valid email is required"],
    },
    phone: { type: String, required: [true, "Phone is required"], trim: true, maxlength: 24 },
    password: { type: String, required: true, minlength: 4, select: false },
    role: { type: String, enum: ROLES, default: "CITIZEN", index: true },
    profileImage: { url: String, publicId: String },
    location: { type: pointSchema, default: undefined },
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", default: null, index: true },
    // Rescuer-only operational fields (kept on User to avoid a second lookup on dashboards)
    availability: { type: String, enum: AVAILABILITY, default: "OFFLINE" },
    activeCases: { type: Number, default: 0, min: 0 },
    completedCases: { type: Number, default: 0, min: 0 },
    totalResponseMins: { type: Number, default: 0, min: 0 },
    ratedResponses: { type: Number, default: 0, min: 0 },
    rating: { type: Number, default: 5, min: 0, max: 5 },
    status: { type: String, enum: USER_STATUS, default: "ACTIVE", index: true },
    isActive: { type: Boolean, default: true },
    isVerified: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.index({ location: "2dsphere" });
userSchema.index({ name: "text", email: "text" });

userSchema.virtual("avgResponseMins").get(function avg() {
  return this.ratedResponses ? Math.round(this.totalResponseMins / this.ratedResponses) : 0;
});

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function compare(candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Password is select:false, but strip it defensively on every serialization.
userSchema.methods.toJSON = function toJSON() {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model("User", userSchema);
