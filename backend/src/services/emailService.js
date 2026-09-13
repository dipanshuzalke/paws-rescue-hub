import { Resend } from "resend";
import { env } from "../config/env.js";

function getResend() {
  if (!env.resend.apiKey || !env.resend.from) {
    throw new Error("Password reset email is not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }
  return new Resend(env.resend.apiKey);
}

function escapeHtml(value) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  try {
    const { error } = await getResend().emails.send({
      from: env.resend.from,
      to,
      subject: "Reset your ResQ Paws password",
      text: `Hi ${name},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Use this link to reset your ResQ Paws password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    });
    if (error) throw new Error(error.message);
  } catch (error) {
    console.error("[email] Password reset delivery failed:", error);
    throw error;
  }
}
