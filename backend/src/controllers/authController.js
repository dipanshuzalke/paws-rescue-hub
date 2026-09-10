import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { Notification } from "../models/Notification.js";
import { RescueAssignment } from "../models/RescueAssignment.js";
import { RescueHistory } from "../models/RescueHistory.js";
import { RescueReport } from "../models/RescueReport.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, created } from "../utils/apiResponse.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../middleware/authMiddleware.js";
import crypto from "crypto";
import { env } from "../config/env.js";
import { sendPasswordResetEmail } from "../services/emailService.js";

/**
 * NGO accounts must be backed by an Organization document, otherwise they show up
 * nowhere in the admin directory and have no team scope of their own.
 */
async function ensureOrganization(user, { name, description } = {}) {
  if (user.role !== "NGO" || user.organization) return user;

  const baseName = (name || `${user.name}'s Organisation`).trim();
  let orgName = baseName;
  for (let i = 2; await Organization.exists({ name: orgName }); i += 1) {
    orgName = `${baseName} ${i}`;
  }

  const org = await Organization.create({
    name: orgName,
    description: description || "",
    email: user.email,
    phone: user.phone,
    contactPerson: user.name,
    verificationStatus: "PENDING",
    createdBy: user._id,
  });

  user.organization = org._id;
  await user.save();
  return user;
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, organizationName, organizationDescription } = req.body;

  if (role === "ADMIN") {
    throw ApiError.forbidden("You cannot self-register as an admin");
  }

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, phone, password, role: role || "CITIZEN" });
  await ensureOrganization(user, { name: organizationName, description: organizationDescription });

  const token = signToken(user._id);
  setAuthCookie(res, token);

  return created(res, { user, token }, "Registered successfully");
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select("+password");
  if (!user) throw ApiError.unauthorized("Invalid email or password");

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw ApiError.unauthorized("Invalid email or password");

  if (!user.isActive || user.status === "INACTIVE" || user.status === "SUSPENDED") {
    throw ApiError.forbidden("This account has been deactivated");
  }

  user.lastLoginAt = new Date();
  user.lastSeenAt = user.lastLoginAt;
  await user.save();
  await ensureOrganization(user);
  if (user.role === "NGO" && user.organization) {
    await Organization.findByIdAndUpdate(user.organization, { lastSeenAt: user.lastSeenAt });
  }

  const token = signToken(user._id);
  setAuthCookie(res, token);

  return ok(res, { user, token }, "Logged in successfully");
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.toLowerCase();
  const user = await User.findOne({ email }).select("+passwordResetToken +passwordResetExpiresAt");

  // Always use the same response so this endpoint cannot be used to discover accounts.
  if (!user) return ok(res, null, "If an account exists for this email, a reset link is on its way.");

  const token = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = crypto.createHash("sha256").update(token).digest("hex");
  user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });

  const clientBaseUrl = env.clientUrl.split(",")[0].trim().replace(/\/$/, "");
  const resetUrl = `${clientBaseUrl}/reset-password?token=${token}`;
  try {
    await sendPasswordResetEmail({ to: user.email, name: user.name, resetUrl });
  } catch (error) {
    console.error("[auth] Password reset email delivery failed:", error);
    user.passwordResetToken = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, "We could not send the reset email. Please try again later.");
  }

  return ok(res, null, "If an account exists for this email, a reset link is on its way.");
});

export const resetPassword = asyncHandler(async (req, res) => {
  const tokenHash = crypto.createHash("sha256").update(req.body.token).digest("hex");
  const user = await User.findOne({
    passwordResetToken: tokenHash,
    passwordResetExpiresAt: { $gt: new Date() },
  }).select("+password +passwordResetToken +passwordResetExpiresAt");

  if (!user) throw ApiError.badRequest("This reset link is invalid or has expired. Request a new one.");

  user.password = req.body.password;
  user.passwordResetToken = undefined;
  user.passwordResetExpiresAt = undefined;
  await user.save();

  return ok(res, null, "Password reset successfully");
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user });
});

export const heartbeat = asyncHandler(async (req, res) => {
  const now = new Date();
  const user = await User.findByIdAndUpdate(req.user._id, { lastSeenAt: now }, { new: true });
  if (user?.role === "NGO" && user.organization) {
    await Organization.findByIdAndUpdate(user.organization, { lastSeenAt: now });
  }
  return ok(res, { lastSeenAt: now });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out successfully");
});

/** Permanently removes the signed-in user's account and its owned data. */
export const deleteMe = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // A citizen owns their submitted reports, so remove those reports and their
  // dependent operational records before deleting the account.
  const ownedReports = await RescueReport.find({ reporter: userId }).select("_id").lean();
  const reportIds = ownedReports.map((report) => report._id);
  if (reportIds.length) {
    await Promise.all([
      RescueAssignment.deleteMany({ report: { $in: reportIds } }),
      RescueHistory.deleteMany({ report: { $in: reportIds } }),
      Notification.deleteMany({ report: { $in: reportIds } }),
      RescueReport.deleteMany({ _id: { $in: reportIds } }),
    ]);
  }

  // Remove assignments involving this user and clear any assignment pointers
  // left on cases, rather than leaving orphaned ObjectId references.
  const assignments = await RescueAssignment.find({
    $or: [{ rescuer: userId }, { assignedBy: userId }],
  }).select("_id").lean();
  const assignmentIds = assignments.map((assignment) => assignment._id);
  if (assignmentIds.length) {
    await Promise.all([
      RescueAssignment.deleteMany({ _id: { $in: assignmentIds } }),
      RescueReport.updateMany(
        { assignment: { $in: assignmentIds } },
        { $set: { assignment: null, assignedRescuer: null } },
      ),
    ]);
  }

  await Promise.all([
    Notification.deleteMany({ recipient: userId }),
    RescueHistory.updateMany({ changedBy: userId }, { $set: { changedBy: null } }),
    RescueReport.updateMany(
      { $or: [{ assignedRescuer: userId }, { duplicateResolvedBy: userId }] },
      { $set: { assignedRescuer: null, duplicateResolvedBy: null } },
    ),
  ]);

  // An NGO coordinator owns its organization record. Detach team members and
  // cases first so none of them retain a reference to a deleted organization.
  if (req.user.role === "NGO" && req.user.organization) {
    const organizationId = req.user.organization;
    await Promise.all([
      User.updateMany({ organization: organizationId }, { $set: { organization: null } }),
      RescueAssignment.updateMany({ organization: organizationId }, { $set: { organization: null } }),
      RescueReport.updateMany({ assignedOrganization: organizationId }, { $set: { assignedOrganization: null } }),
      Organization.findByIdAndDelete(organizationId),
    ]);
  }

  await User.findByIdAndDelete(userId);
  clearAuthCookie(res);
  return ok(res, null, "Account permanently deleted");
});

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "availability"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (req.body.location) {
    updates.location = {
      ...(req.user.location?.toObject?.() ?? req.user.location ?? {}),
      ...req.body.location,
      type: "Point",
    };
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return ok(res, { user }, "Profile updated successfully");
});
