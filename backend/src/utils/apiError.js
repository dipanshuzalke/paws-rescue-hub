export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
  }
  static badRequest(m = "Bad request", d) { return new ApiError(400, m, d); }
  static unauthorized(m = "Authentication required") { return new ApiError(401, m); }
  static forbidden(m = "You do not have permission to perform this action") { return new ApiError(403, m); }
  static notFound(m = "Resource not found") { return new ApiError(404, m); }
  static conflict(m = "Conflict") { return new ApiError(409, m); }
  static unprocessable(m = "Unprocessable request", d) { return new ApiError(422, m, d); }
}

/** Wraps async controllers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);
