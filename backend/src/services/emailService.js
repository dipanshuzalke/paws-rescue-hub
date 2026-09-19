import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "../config/env.js";
import { User } from "../models/User.js";

let smtpTransporter = null;
function getSmtpTransporter() {
  if (!smtpTransporter && env.smtp.user && env.smtp.pass) {
    smtpTransporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: {
        user: env.smtp.user,
        pass: env.smtp.pass,
      },
    });
  }
  return smtpTransporter;
}

function getResend() {
  if (!env.resend.apiKey || !env.resend.from) {
    throw new Error("Resend is not configured. Set RESEND_API_KEY and RESEND_FROM.");
  }
  return new Resend(env.resend.apiKey);
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character]);
}

/**
 * Universal email sender: prefers SMTP (e.g. Gmail), falls back to Resend.
 */
export async function sendMail({ to, subject, text, html }) {
  const transporter = getSmtpTransporter();
  if (transporter) {
    const fromAddress = env.smtp.from.includes("@") && !env.smtp.from.includes("<")
      ? `"SafePaws" <${env.smtp.from}>`
      : env.smtp.from;

    return await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
      html,
    });
  }

  if (env.resend.apiKey && env.resend.from) {
    const { data, error } = await getResend().emails.send({
      from: env.resend.from,
      to,
      subject,
      text,
      html,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  console.warn("[email] Neither SMTP nor Resend is configured — skipping email dispatch.");
  return null;
}

export async function sendPasswordResetEmail({ to, name, resetUrl }) {
  try {
    await sendMail({
      to,
      subject: "Reset your ResQ Paws password",
      text: `Hi ${name},\n\nUse this link to reset your password:\n${resetUrl}\n\nThis link expires in 1 hour. If you did not request this, you can ignore this email.`,
      html: `<p>Hi ${escapeHtml(name)},</p><p>Use this link to reset your ResQ Paws password:</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires in 1 hour. If you did not request this, you can ignore this email.</p>`,
    });
  } catch (error) {
    console.error("[email] Password reset delivery failed:", error);
    throw error;
  }
}

/* ──────────────────────────────────────────────────────────
   Email rescuers when a new report is created.
   Fire-and-forget — failures are logged, NEVER thrown.
   ────────────────────────────────────────────────────────── */
const EMERGENCY_EMOJI = { CRITICAL: "🔴", HIGH: "🟠", MEDIUM: "🟡", LOW: "🟢" };

function buildReportEmailHtml(report) {
  const emoji = EMERGENCY_EMOJI[report.emergencyLevel] || "⚪";
  const clientUrl = (env.clientUrl || "").split(",")[0].trim();
  const link = clientUrl ? `${clientUrl}/rescuer/requests/${report._id}` : "";

  return `
<div style="font-family:'Segoe UI',Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 28px;text-align:center">
    <h1 style="margin:0;color:#fff;font-size:22px">🐾 ResQ Paws</h1>
    <p style="margin:6px 0 0;color:#e0e7ff;font-size:14px">New Rescue Report</p>
  </div>
  <div style="padding:28px">
    <table style="width:100%;border-collapse:collapse;font-size:15px;color:#374151">
      <tr><td style="padding:8px 0;font-weight:600;width:130px">Animal</td><td style="padding:8px 0">${escapeHtml(report.animalType || "Unknown")}${report.animalCount > 1 ? " (×" + report.animalCount + ")" : ""}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Condition</td><td style="padding:8px 0">${escapeHtml(report.condition || "Unknown")}</td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Emergency</td><td style="padding:8px 0">${emoji} <strong>${escapeHtml(report.emergencyLevel || "MEDIUM")}</strong></td></tr>
      <tr><td style="padding:8px 0;font-weight:600">Location</td><td style="padding:8px 0">${escapeHtml(report.address || "Not specified")}${report.city ? ", " + escapeHtml(report.city) : ""}</td></tr>
      ${report.description ? `<tr><td style="padding:8px 0;font-weight:600">Details</td><td style="padding:8px 0;color:#6b7280">${escapeHtml(report.description).slice(0, 200)}${report.description.length > 200 ? "…" : ""}</td></tr>` : ""}
    </table>
    ${link ? `<div style="text-align:center;margin:24px 0 8px"><a href="${link}" style="display:inline-block;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;text-decoration:none;padding:12px 32px;border-radius:8px;font-weight:600;font-size:15px">View Report →</a></div>` : ""}
  </div>
  <div style="background:#f9fafb;padding:14px 28px;text-align:center;font-size:12px;color:#9ca3af;border-top:1px solid #e5e7eb">
    You received this because you are a registered rescuer on ResQ Paws.
  </div>
</div>`;
}

/**
 * Sends email to all active rescuers about a new report.
 * SAFE: Never throws — logs errors and returns silently.
 */
export async function notifyRescuersNewReport(report) {
  try {
    const hasSmtp = Boolean(env.smtp.user && env.smtp.pass);
    const hasResend = Boolean(env.resend.apiKey && env.resend.from);

    if (!hasSmtp && !hasResend) {
      console.warn("[email] Email service not configured (neither SMTP nor Resend) — skipping rescuer email notifications.");
      return;
    }

    const rescuers = await User.find({ role: "RESCUER", isActive: true }).select("email name").lean();
    if (!rescuers.length) {
      console.log("[email] No active rescuers found in database to notify.");
      return;
    }

    const emoji = EMERGENCY_EMOJI[report.emergencyLevel] || "⚪";
    const subject = `${emoji} New ${report.emergencyLevel || "MEDIUM"} Report — ${report.animalType || "Animal"} ${(report.condition || "reported").toLowerCase()}`;
    const html = buildReportEmailHtml(report);
    const text = `New rescue report: ${report.animalType} (${report.condition}) at ${report.address || "unknown location"} — Emergency: ${report.emergencyLevel}`;

    const validRescuers = rescuers.filter((r) => r.email);
    console.log(`[email] Dispatching rescue notification to ${validRescuers.length} rescuers...`);

    const results = await Promise.allSettled(
      validRescuers.map((r) =>
        sendMail({ to: r.email, subject, text, html })
          .catch((err) => console.error(`[email] Failed for ${r.email}:`, err.message))
      )
    );

    const sent = results.filter((r) => r.status === "fulfilled" && r.value !== null).length;
    console.log(`[email] Notified ${sent}/${validRescuers.length} rescuers about report ${report._id}`);
  } catch (err) {
    console.error("[email] notifyRescuersNewReport failed:", err.message);
  }
}
