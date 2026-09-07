import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { User } from "../models/User.js";
import { ApiError, asyncHandler } from "../utils/apiError.js";

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

export function setAuthCookie(res, token) {
  res.cookie(env.cookieName, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(env.cookieName, {
    path: "/",
    secure: env.isProd,
    sameSite: env.isProd ? "none" : "lax",
  });
}

function extractToken(req) {
  const header = req.headers.authorization || "";
  if (header.startsWith("Bearer ")) return header.slice(7);
  return req.cookies?.[env.cookieName] || null;
}

/** Rejects the request unless a valid JWT maps to an active user. */
export const authenticateUser = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) throw ApiError.unauthorized();

  let payload;
  try {
    payload = jwt.verify(token, env.jwtSecret);
  } catch {
    throw ApiError.unauthorized("Session expired, please sign in again");
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized("Account no longer exists");
  if (!user.isActive || user.status === "INACTIVE" || user.status === "SUSPENDED") {
    throw ApiError.forbidden("This account has been deactivated");
  }

  req.user = user;
  next();
});

/** Attaches req.user when a token is present, but never rejects. */
export const optionalAuth = asyncHandler(async (req, _res, next) => {
  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = await User.findById(payload.sub);
  } catch {
    req.user = undefined;
  }
  next();
});
