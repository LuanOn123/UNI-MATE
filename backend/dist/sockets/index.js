import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Message } from "../models/Message.js";
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
        socket.on("join_room", async ({ roomId }) => {
            const room = await ChatRoom.findOne({ _id: roomId, users: socket.data.userId, status: "active" });
            if (room)
                socket.join(roomId);
        });
        socket.on("send_message", async ({ roomId, text }) => {
            const room = await ChatRoom.findOne({ _id: roomId, users: socket.data.userId, status: "active" });
            if (!room || !text?.trim())
                return;
            const match = await Match.findById(room.match);
            if (match?.status !== "chat_opened")
                return;
            const message = await Message.create({ room: roomId, sender: socket.data.userId, text: text.trim(), readBy: [socket.data.userId] });
            room.lastMessage = text.trim();
            room.lastMessageAt = new Date();
            await room.save();
            const payload = await message.populate("sender", "displayName avatarUrl");
            const plain = payload.toObject();
            io.to(roomId).emit("new_message", { ...plain, senderId: socket.data.userId });
        });
        socket.on("typing_start", ({ roomId }) => socket.to(roomId).emit("user_typing", { userId: socket.data.userId, typing: true }));
        socket.on("typing_stop", ({ roomId }) => socket.to(roomId).emit("user_typing", { userId: socket.data.userId, typing: false }));
        socket.on("mark_read", async ({ roomId }) => {
            await Message.updateMany({ room: roomId }, { $addToSet: { readBy: socket.data.userId } });
            socket.to(roomId).emit("message_read", { userId: socket.data.userId });
        });
    });
}
