import { User } from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";
import { ok, created } from "../utils/apiResponse.js";
import { signToken, setAuthCookie, clearAuthCookie } from "../middleware/authMiddleware.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;

  if (role === "ADMIN") {
    throw ApiError.forbidden("You cannot self-register as an admin");
  }

  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict("An account with this email already exists");

  const user = await User.create({ name, email, phone, password, role: role || "CITIZEN" });

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
