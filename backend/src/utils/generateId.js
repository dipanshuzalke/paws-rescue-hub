import crypto from "crypto";

/** Human-friendly report id, e.g. RQ-8F3K2A. */
export function generateReportId(prefix = "RQ") {
  const token = crypto.randomBytes(4).toString("hex").toUpperCase().slice(0, 6);
  return `${prefix}-${token}`;
}
