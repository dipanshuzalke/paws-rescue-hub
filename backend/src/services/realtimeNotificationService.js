/**
 * In-process fan-out for notification streams. The notification itself remains
 * persisted in MongoDB; this only delivers the "new notification" signal to
 * currently connected clients (SSE + Socket.IO).
 */
import { getIO } from "../sockets/socketServer.js";

const subscribers = new Map();

export function serializeNotification(notification) {
  const doc = notification?.toJSON?.() ?? notification ?? {};
  const id = doc._id || doc.id;
  const recipient = doc.recipient?._id || doc.recipient;
  const report = doc.report?._id || doc.report;
  return {
    _id: id ? String(id) : undefined,
    recipient: recipient ? String(recipient) : null,
    report: report ? String(report) : null,
    type: doc.type,
    title: doc.title,
    message: doc.message,
    emergencyLevel: doc.emergencyLevel || null,
    link: doc.link || "",
    isRead: Boolean(doc.isRead),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

export function subscribeToNotifications(userId, send) {
  const key = String(userId);
  const listeners = subscribers.get(key) ?? new Set();
  listeners.add(send);
  subscribers.set(key, listeners);

  return () => {
    listeners.delete(send);
    if (listeners.size === 0) subscribers.delete(key);
  };
}

export function publishNotification(notification) {
  const payload = serializeNotification(notification);
  const recipient = payload.recipient;
  if (!recipient) return;

  const json = JSON.stringify(payload);
  const listeners = subscribers.get(String(recipient));
  if (listeners) {
    for (const send of listeners) {
      try {
        send(json);
      } catch {
        listeners.delete(send);
      }
    }
    if (listeners.size === 0) subscribers.delete(String(recipient));
  }

  try {
    const io = getIO();
    if (io) io.to(`user:${recipient}`).emit("notification", payload);
  } catch (err) {
    console.error("[realtimeNotification] Socket.IO emit failed:", err.message);
  }
}
