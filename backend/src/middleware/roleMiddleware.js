import { ApiError } from "../utils/apiError.js";

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

export const requireAdmin = authorizeRoles("ADMIN");
export const requireNgoOrAdmin = authorizeRoles("NGO", "ADMIN");
export const requireRescuer = authorizeRoles("RESCUER");
export const requireCitizen = authorizeRoles("CITIZEN");
