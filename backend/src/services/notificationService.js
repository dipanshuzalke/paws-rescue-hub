import { Notification } from "../models/Notification.js";
import { User } from "../models/User.js";

/** Creates a single notification. Never throws — logs and swallows failures. */
export async function createNotification({ recipient, report, type, title, message, emergencyLevel, link }) {
  try {
    if (!recipient) return null;
    return await Notification.create({
      recipient,
      report: report || null,
      type: type || "SYSTEM",
      title,
      message,
      emergencyLevel: emergencyLevel || null,
      link: link || "",
    });
  } catch (err) {
    console.error("[notificationService] createNotification failed:", err.message);
    return null;
  }
}

/** Fans a payload out to a list of recipient user ids. */
export async function notifyUsers(recipients = [], payload = {}) {
  try {
    const ids = (recipients || []).filter(Boolean).map((r) => (r._id ? r._id : r));
    if (!ids.length) return [];
    return await Promise.all(ids.map((recipient) => createNotification({ ...payload, recipient })));
  } catch (err) {
    console.error("[notificationService] notifyUsers failed:", err.message);
    return [];
  }
}

/** Fans a payload out to every active user of a given role (e.g. alert NGO+ADMIN of new reports). */
export async function notifyRole(role, payload = {}) {
  try {
    const roles = Array.isArray(role) ? role : [role];
    const users = await User.find({ role: { $in: roles }, isActive: true }).select("_id");
    return await notifyUsers(users, payload);
  } catch (err) {
    console.error("[notificationService] notifyRole failed:", err.message);
    return [];
  }
}
