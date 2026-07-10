import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Message } from "../models/Message.js";
import { Group } from "../models/Group.js";
import { GroupMessage } from "../models/GroupMessage.js";
import { Group } from "../models/Group.js";
import { GroupMessage } from "../models/GroupMessage.js";
import { createAndEmitNotification } from "../services/notification.service.js";
import { User } from "../models/User.js";
import { verifyAccessToken } from "../utils/tokens.js";
export function registerSockets(io) {
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token)
                return next(new Error("Missing token"));
            const payload = verifyAccessToken(token);
            const user = await User.findById(payload.userId).select("_id status isActive");
            if (!user)
                return next(new Error("Invalid user"));
            if (!user.isActive || user.status === "banned" || user.status === "suspended")
                return next(new Error("Invalid user"));
            socket.data.userId = String(user._id);
            next();
        }
        catch {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => {
        socket.join(`user:${socket.data.userId}`);
        const userId = socket.data.userId;
        socket.join(`user:${userId}`);
        const userId = socket.data.userId;
        socket.join(`user:${userId}`);
        socket.on("join_room", async ({ roomId }) => {
            const room = await ChatRoom.findOne({ _id: roomId, users: socket.data.userId, status: "active" });
            if (room)
                socket.join(roomId);
        });
        socket.on("send_message", async (data) => {
            try {
                const room = await ChatRoom.findById(data.roomId);
                if (!room || room.status !== "active")
                    return socket.emit("message_error", { roomId: data.roomId, message: "Chat is not active" });
                if (!data.text?.trim() && !data.fileUrl)
                    return socket.emit("message_error", { roomId: data.roomId, message: "Tin nhắn không được để trống" });
                const match = await Match.findById(room.match);
                if (match?.status !== "chat_opened")
                    return socket.emit("message_error", { roomId: data.roomId, message: "Chat is not active" });
                const message = await Message.create({
                    room: room._id,
                    sender: userId,
                    text: data.text || "",
                    type: data.type || "text",
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    readBy: [userId]
                });
                room.lastMessage = data.type === "image" ? "[Hình ảnh]" : data.type === "video" ? "[Video]" : data.type === "file" ? "[Tập tin]" : data.text?.trim() || "";
                room.lastMessageAt = new Date();
                await room.save();
                const payload = await message.populate("sender", "displayName avatarUrl");
                const plain = payload.toObject();
                io.to(data.roomId).emit("new_message", { ...plain, senderId: userId });
                const recipients = room.users.map(String).filter((uId) => uId !== userId);
                await Promise.all(recipients.map((uId) => createAndEmitNotification(io, {
                    userId: uId,
                    type: "message",
                    title: "Tin nhắn mới",
                    body: (data.text || "Đã gửi một tệp tin").trim().slice(0, 120),
                    data: { roomId: String(room._id), senderId: userId }
                })));
            }
            catch (error) {
                console.error(error);
            }
        });
        socket.on("typing_start", ({ roomId }) => socket.to(roomId).emit("user_typing", { userId: socket.data.userId, typing: true }));
        socket.on("typing_stop", ({ roomId }) => socket.to(roomId).emit("user_typing", { userId: socket.data.userId, typing: false }));
        socket.on("mark_read", async ({ roomId }) => {
            await Message.updateMany({ room: roomId }, { $addToSet: { readBy: socket.data.userId } });
            socket.to(roomId).emit("message_read", { userId: socket.data.userId });
        });
        // Group chat events
        socket.on("join_group", async ({ groupId }) => {
            const group = await Group.findOne({ _id: groupId, members: socket.data.userId, status: "active" });
            if (group)
                socket.join(`group:${groupId}`);
        });
        socket.on("send_group_message", async (data) => {
            try {
                const group = await Group.findById(data.groupId);
                if (!group || group.status === "dissolved") {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Nhóm không tồn tại hoặc đã giải tán" });
                }
                const isMember = group.members.some((m) => m.toString() === socket.data.userId);
                if (!isMember) {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Bạn không phải thành viên nhóm này" });
                }
                if (!data.text?.trim() && !data.fileUrl) {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Tin nhắn không được để trống" });
                }
                const message = await GroupMessage.create({
                    group: group._id,
                    sender: socket.data.userId,
                    text: data.text || "",
                    type: data.type || "text",
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    readBy: [socket.data.userId]
                });
                const payload = await message.populate("sender", "displayName avatarUrl");
                const plain = payload.toObject();
                io.to(`group:${data.groupId}`).emit("new_group_message", { ...plain, senderId: socket.data.userId });
                const recipients = group.members.map(String).filter((userId) => userId !== socket.data.userId);
                await Promise.all(recipients.map((userId) => createAndEmitNotification(io, {
                    userId,
                    type: "group_message",
                    title: `Tin nhắn mới từ nhóm ${group.name}`,
                    body: (data.text || "Đã gửi một tệp tin").trim().slice(0, 120),
                    data: { groupId: String(group._id) }
                })));
            }
            catch (error) {
                console.error(error);
            }
        });
        socket.on("group_typing_start", ({ groupId }) => socket.to(`group:${groupId}`).emit("group_user_typing", { userId: socket.data.userId, typing: true }));
        socket.on("group_typing_stop", ({ groupId }) => socket.to(`group:${groupId}`).emit("group_user_typing", { userId: socket.data.userId, typing: false }));
        socket.on("mark_group_read", async ({ groupId }) => {
            await GroupMessage.updateMany({ group: groupId }, { $addToSet: { readBy: socket.data.userId } });
            socket.to(`group:${groupId}`).emit("group_message_read", { userId: socket.data.userId });
        });
        // Group chat events
        socket.on("join_group", async ({ groupId }) => {
            const group = await Group.findOne({ _id: groupId, members: socket.data.userId, status: "active" });
            if (group)
                socket.join(`group:${groupId}`);
        });
        socket.on("send_group_message", async (data) => {
            try {
                const group = await Group.findById(data.groupId);
                if (!group || group.status === "dissolved") {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Nhóm không tồn tại hoặc đã giải tán" });
                }
                const isMember = group.members.some((m) => m.toString() === socket.data.userId);
                if (!isMember) {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Bạn không phải thành viên nhóm này" });
                }
                if (!data.text?.trim() && !data.fileUrl) {
                    return socket.emit("group_message_error", { groupId: data.groupId, message: "Tin nhắn không được để trống" });
                }
                const message = await GroupMessage.create({
                    group: group._id,
                    sender: socket.data.userId,
                    text: data.text || "",
                    type: data.type || "text",
                    fileUrl: data.fileUrl,
                    fileName: data.fileName,
                    readBy: [socket.data.userId]
                });
                const payload = await message.populate("sender", "displayName avatarUrl");
                const plain = payload.toObject();
                io.to(`group:${data.groupId}`).emit("new_group_message", { ...plain, senderId: socket.data.userId });
                const recipients = group.members.map(String).filter((userId) => userId !== socket.data.userId);
                await Promise.all(recipients.map((userId) => createAndEmitNotification(io, {
                    userId,
                    type: "group_message",
                    title: `Tin nhắn mới từ nhóm ${group.name}`,
                    body: (data.text || "Đã gửi một tệp tin").trim().slice(0, 120),
                    data: { groupId: String(group._id) }
                })));
            }
            catch (error) {
                console.error(error);
            }
        });
        socket.on("group_typing_start", ({ groupId }) => socket.to(`group:${groupId}`).emit("group_user_typing", { userId: socket.data.userId, typing: true }));
        socket.on("group_typing_stop", ({ groupId }) => socket.to(`group:${groupId}`).emit("group_user_typing", { userId: socket.data.userId, typing: false }));
        socket.on("mark_group_read", async ({ groupId }) => {
            await GroupMessage.updateMany({ group: groupId }, { $addToSet: { readBy: socket.data.userId } });
            socket.to(`group:${groupId}`).emit("group_message_read", { userId: socket.data.userId });
        });
    });
}
