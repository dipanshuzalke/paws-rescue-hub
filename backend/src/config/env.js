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
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || "",
    apiKey: process.env.CLOUDINARY_API_KEY || "",
    apiSecret: process.env.CLOUDINARY_API_SECRET || "",
    folder: process.env.CLOUDINARY_FOLDER || "resqpaws",
  },
  seedPassword: process.env.SEED_PASSWORD || "demo1234",
};
