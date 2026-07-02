import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Message } from "../models/Message.js";
import { createAndEmitNotification } from "../services/notification.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const listRooms = asyncHandler(async (req, res) => {
    const rooms = await ChatRoom.find({ users: req.user.id }).populate("users place").sort({ lastMessageAt: -1 });
    res.json({ rooms });
});
export const getRoom = asyncHandler(async (req, res) => {
    const room = await ChatRoom.findOne({ _id: req.params.roomId, users: req.user.id }).populate("users place match");
    if (!room)
        return res.status(404).json({ message: "Room not found" });
    const match = await Match.findById(room.match);
    if (match?.status !== "chat_opened")
        return res.status(403).json({ message: "Chat is locked until cafe is confirmed" });
    if (room.status !== "active")
        return res.status(403).json({ message: "Chat is not active" });
    const messages = await Message.find({ room: room._id }).sort({ createdAt: 1 }).limit(100).populate("sender", "displayName avatarUrl");
    const normalizedMessages = messages.map((message) => {
        const plain = message.toObject();
        const senderId = String(message.sender?._id ?? message.sender);
        return { ...plain, senderId, mine: senderId === req.user.id };
    });
    res.json({ room, messages: normalizedMessages, currentUserId: req.user.id });
});
export const sendMessage = asyncHandler(async (req, res) => {
    const room = await ChatRoom.findOne({ _id: req.params.roomId, users: req.user.id });
    if (!room)
        return res.status(404).json({ message: "Room not found" });
    const match = await Match.findById(room.match);
    if (match?.status !== "chat_opened" || room.status !== "active")
        return res.status(403).json({ message: "Chat is not active" });
    const message = await Message.create({ room: room._id, sender: req.user.id, text: req.body.text, readBy: [req.user.id] });
    room.lastMessage = req.body.text;
    room.lastMessageAt = new Date();
    await room.save();
    await message.populate("sender", "displayName avatarUrl");
    const plain = message.toObject();
    const outgoing = { ...plain, senderId: req.user.id };
    const io = req.app.get("io");
    io?.to(String(room._id)).emit("new_message", outgoing);
    await Promise.all(room.users
        .map(String)
        .filter((userId) => userId !== req.user.id)
        .map((userId) => createAndEmitNotification(io, {
        userId,
        type: "message",
        title: "Tin nhắn mới",
        body: req.body.text.slice(0, 120)
    })));
    res.status(201).json({ message: { ...outgoing, mine: true } });
});
