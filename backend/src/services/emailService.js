import nodemailer from "nodemailer";
import { env } from "../config/env.js";

function getTransport() {
  const { host, port, secure, user, pass } = env.smtp;
  if (!host || !user || !pass || !env.smtp.from) {
    throw new Error("Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and SMTP_FROM.");
  }
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    connectionTimeout: env.smtp.connectionTimeoutMs,
    greetingTimeout: env.smtp.greetingTimeoutMs,
    socketTimeout: env.smtp.socketTimeoutMs,
    tls: { minVersion: "TLSv1.2" },
  });
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  try {
    await getTransport().sendMail({
      from: env.smtp.from,
      to,
      subject: "Reset your ResQ Paws password",
      text: `Hi ${name},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `<p>Hi ${name},</p><p>Use this link to reset your ResQ Paws password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    });
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? error.code : "unknown";
    console.error(`[email] Password reset delivery failed (${code}):`, error.message);
    if (["ETIMEDOUT", "ESOCKET", "ECONNECTION"].includes(code)) {
      throw new Error("The email provider did not respond in time. Please try again shortly.");
    }
    throw error;
  }
}
