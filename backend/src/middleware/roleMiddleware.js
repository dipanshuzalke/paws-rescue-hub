import { ApiError } from "../utils/apiError.js";
import { Organization } from "../models/Organization.js";

/** Backend-enforced role gate — never rely on frontend route protection alone. */
export function authorizeRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden(`This action requires one of: ${roles.join(", ")}`));
    }
    next();
  };
}

/** Allows admins and verified NGO accounts to use NGO operations. */
export async function requireVerifiedNgo(req, _res, next) {
  try {
    if (!req.user) return next(ApiError.unauthorized());
    if (req.user.role === "ADMIN") return next();
    if (req.user.role !== "NGO") return next();

    const organization = req.user.organization
      ? await Organization.findById(req.user.organization).select("verificationStatus isActive")
      : null;
    if (!organization || organization.verificationStatus !== "VERIFIED" || !organization.isActive) {
      return next(ApiError.forbidden("Your NGO profile is pending admin verification"));
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

export const requireAdmin = authorizeRoles("ADMIN");
export const requireNgoOrAdmin = authorizeRoles("NGO", "ADMIN");
export const requireRescuer = authorizeRoles("RESCUER");
export const requireCitizen = authorizeRoles("CITIZEN");
