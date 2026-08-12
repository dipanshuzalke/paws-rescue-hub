import multer from "multer";
import { env } from "../config/env.js";
import { ApiError } from "../utils/apiError.js";

export function notFoundHandler(req, _res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Something went wrong";
  let details = err.details;

  if (err.name === "ValidationError") {
    statusCode = 422;
    details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    message = details[0]?.message || "Validation failed";
  } else if (err.name === "CastError") {
    statusCode = 400;
    message = `Invalid ${err.path}`;
  } else if (err.code === 11000) {
    statusCode = 409;
    message = `${Object.keys(err.keyValue || {})[0] || "Value"} already exists`;
  } else if (err instanceof multer.MulterError) {
    statusCode = 400;
    message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Each image must be 5MB or smaller"
        : err.code === "LIMIT_FILE_COUNT"
          ? "Too many images uploaded"
          : "Image upload failed";
  }

  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    success: false,
    message: statusCode >= 500 && env.isProd ? "Unable to process request" : message,
    ...(details ? { errors: details } : {}),
    // Stack traces never leave the server in production.
    ...(!env.isProd && statusCode >= 500 ? { stack: err.stack } : {}),
  });
}
