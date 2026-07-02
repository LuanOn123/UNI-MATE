import { Router } from "express";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "../controllers/notification.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const notificationRouter = Router();
notificationRouter.use(requireAuth);
notificationRouter.get("/", listNotifications);
notificationRouter.patch("/read-all", markAllNotificationsRead);
notificationRouter.patch("/:notificationId/read", markNotificationRead);
