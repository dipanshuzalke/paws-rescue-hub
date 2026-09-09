import dotenv from "dotenv";
dotenv.config();

const required = ["MONGODB_URI", "JWT_SECRET"];
const missing = required.filter((k) => !process.env[k]);
if (missing.length) {
  // Fail loudly and clearly at startup rather than at first request.
  console.error(`[config] Missing required environment variables: ${missing.join(", ")}`);
  console.error("[config] Copy .env.example to .env and fill in the values.");
  process.exit(1);
}

export const env = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || "development",
  isProd: (process.env.NODE_ENV || "development") === "production",
  clientUrl: process.env.CLIENT_URL || "http://localhost:8080",
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  cookieName: process.env.COOKIE_NAME || "resqpaws_token",
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || process.env.SMTP_USER || "",
    // Keep mail delivery failures below the frontend API timeout (20 seconds).
    connectionTimeoutMs: Number(process.env.SMTP_CONNECTION_TIMEOUT_MS || 10_000),
    greetingTimeoutMs: Number(process.env.SMTP_GREETING_TIMEOUT_MS || 10_000),
    socketTimeoutMs: Number(process.env.SMTP_SOCKET_TIMEOUT_MS || 15_000),
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "resqpaws",
  },
  duplicates: {
    radiusMeters: Number(process.env.DUPLICATE_REPORT_RADIUS_METERS || 500),
    windowHours: Number(process.env.DUPLICATE_REPORT_WINDOW_HOURS || 48),
    // Minimum score (0-100) a candidate needs before it is shown to a citizen.
    minScore: Number(process.env.DUPLICATE_REPORT_MIN_SCORE || 50),
  },
  seedPassword: process.env.SEED_PASSWORD || "demo1234",
};
