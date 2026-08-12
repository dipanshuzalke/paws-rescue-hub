import mongoose from "mongoose";
import { env } from "./env.js";

mongoose.set("strictQuery", true);

export async function connectDatabase() {
  try {
    const conn = await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 10000 });
    console.log(`[db] MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
}

mongoose.connection.on("disconnected", () => console.warn("[db] MongoDB disconnected"));
mongoose.connection.on("error", (e) => console.error(`[db] MongoDB error: ${e.message}`));

export async function disconnectDatabase() {
  await mongoose.connection.close();
  console.log("[db] MongoDB connection closed");
}
