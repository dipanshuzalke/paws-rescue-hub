import { Notification } from "../models/Notification.js";
import { asyncHandler, ApiError } from "../utils/apiError.js";
import { ok, list, buildPagination, parseQueryOptions } from "../utils/apiResponse.js";
import { subscribeToNotifications } from "../services/realtimeNotificationService.js";

/** Keeps an authenticated client open and pushes newly persisted notifications. */
export const streamNotifications = (req, res) => {
  res.status(200).set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  res.write("retry: 3000\n\n");

  const unsubscribe = subscribeToNotifications(req.user._id, (payload) => {
    res.write(`event: notification\ndata: ${payload}\n\n`);
  });
  const heartbeat = setInterval(() => res.write(": keep-alive\n\n"), 25_000);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
};

export const getNotifications = asyncHandler(async (req, res) => {
  const { page, limit, skip, sort } = parseQueryOptions(req.query, { defaultSort: "createdAt" });
  const filter = { recipient: req.user._id };
  if (req.query.type) filter.type = req.query.type;
  if (req.query.isRead !== undefined) filter.isRead = req.query.isRead === "true";

  const [items, total] = await Promise.all([
    Notification.find(filter).sort(sort).skip(skip).limit(limit),
    Notification.countDocuments(filter),
  ]);

  return list(res, items, buildPagination({ page, limit, total }));
});

export const getUnread = asyncHandler(async (req, res) => {
  const filter = { recipient: req.user._id, isRead: false };
  const [items, count] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(50),
    Notification.countDocuments(filter),
  ]);
  return ok(res, { items, count });
});

export const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound("Notification not found");
  notification.isRead = true;
  await notification.save();
  return ok(res, notification);
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, isRead: false }, { $set: { isRead: true } });
  return ok(res, null, "All notifications marked as read");
});

export const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, recipient: req.user._id });
  if (!notification) throw ApiError.notFound("Notification not found");
  return ok(res, null, "Notification deleted");
});
