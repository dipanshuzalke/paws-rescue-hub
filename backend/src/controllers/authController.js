import { User } from "../models/User.js";
import { Organization } from "../models/Organization.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, created } from "../utils/apiResponse.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../middleware/authMiddleware.js";

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
  await user.save();
  await ensureOrganization(user);

  const token = signToken(user._id);
  setAuthCookie(res, token);

  return ok(res, { user, token }, "Logged in successfully");
});

export const me = asyncHandler(async (req, res) => {
  return ok(res, { user: req.user });
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  return ok(res, null, "Logged out successfully");
});

export const updateMe = asyncHandler(async (req, res) => {
  const allowed = ["name", "phone", "availability"];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true,
  });

  return ok(res, { user }, "Profile updated successfully");
});
