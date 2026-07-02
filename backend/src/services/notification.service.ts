import type { Server } from "socket.io";
import { Notification } from "../models/Notification.js";

type NotificationPayload = {
  userId: string;
  type: string;
  title: string;
  body?: string;
  data?: Record<string, unknown>;
};

export async function createAndEmitNotification(io: Server | undefined, payload: NotificationPayload) {
  const notification = await Notification.create({
    user: payload.userId,
    type: payload.type,
    title: payload.title,
    body: payload.body,
    data: payload.data
  });
  io?.to(`user:${payload.userId}`).emit("notification:new", notification.toObject());
  return notification;
}

export function emitMatchUpdated(io: Server | undefined, userIds: string[], payload: unknown) {
  userIds.forEach((userId) => io?.to(`user:${userId}`).emit("match:updated", payload));
}
