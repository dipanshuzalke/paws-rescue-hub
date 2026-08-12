import { ApiError } from "../utils/apiError.js";

/** Validates req[source] with a Zod schema and replaces it with the parsed value. */
export function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const first = result.error.issues[0];
      const details = result.error.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      }));
      return next(ApiError.badRequest(first?.message || "Invalid request", details));
    }
    if (source === "body") req.body = result.data;
    else req.validatedQuery = result.data;
    next();
  };
}
