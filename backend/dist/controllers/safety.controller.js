import { ChatRoom } from "../models/ChatRoom.js";
import { Match } from "../models/Match.js";
import { Report } from "../models/Report.js";
import { User } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
export const reportUser = asyncHandler(async (req, res) => {
    if (req.body.room) {
        const room = await ChatRoom.findOne({ _id: req.body.room, users: { $all: [req.user.id, req.body.reportedUser] } });
        if (!room)
            return res.status(400).json({ message: "Invalid chat room for this report" });
    }
    const report = await Report.create({
        reporter: req.user.id,
        reportedUser: req.body.reportedUser,
        match: req.body.match,
        room: req.body.room,
        message: req.body.message,
        reason: req.body.reason,
        details: req.body.details,
        incidentAt: req.body.incidentAt ? new Date(req.body.incidentAt) : undefined,
        evidenceUrls: req.body.evidenceUrls ?? []
    });
    const uniqueReporters = await Report.distinct("reporter", { reportedUser: req.body.reportedUser });
    if (uniqueReporters.length >= 3) {
        await Report.updateMany({ reportedUser: req.body.reportedUser, status: { $in: ["new", "reviewing"] } }, { priority: true });
        report.priority = true;
        await report.save();
    }
    res.status(201).json({ report });
});
export const blockUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(req.user.id, { $addToSet: { blockedUsers: req.body.targetUserId } });
    const matches = await Match.find({ users: { $all: [req.user.id, req.body.targetUserId] } });
    const matchIds = matches.map((match) => match._id);
    await Match.updateMany({ _id: { $in: matchIds } }, { status: "blocked" });
    await ChatRoom.updateMany({ match: { $in: matchIds } }, { status: "blocked" });
    res.json({ message: "User blocked" });
});
