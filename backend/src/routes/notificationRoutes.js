import { Router } from "express";
import { authenticateUser } from "../middleware/authMiddleware.js";
import {
  getNotifications,
  getUnread,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from "../controllers/notificationController.js";

const router = Router();

router.use(authenticateUser);

router.get("/", getNotifications);
router.get("/unread", getUnread);
router.patch("/read-all", markAllAsRead);
router.patch("/:id/read", markAsRead);
router.delete("/:id", deleteNotification);

export default router;
