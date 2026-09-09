/**
 * In-process fan-out for notification streams. The notification itself remains
 * persisted in MongoDB; this only delivers the "new notification" signal to
 * currently connected clients.
 */
const subscribers = new Map();

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
  const listeners = subscribers.get(String(notification.recipient));
  if (!listeners) return;

  const payload = JSON.stringify(notification.toJSON?.() ?? notification);
  for (const send of listeners) {
    try {
      send(payload);
    } catch {
      listeners.delete(send);
    }
  }
  if (listeners.size === 0) subscribers.delete(String(notification.recipient));
}
