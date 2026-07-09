import { Router } from "express";
import { addMember, createGroup, dissolveGroup, getGroupDetail, getMyGroups, removeMember } from "../controllers/group.controller.js";
import { getGroupMessages, sendGroupMessage } from "../controllers/groupChat.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const groupRouter = Router();
groupRouter.use(requireAuth);
groupRouter.post("/", createGroup);
groupRouter.get("/", getMyGroups);
groupRouter.get("/:id", getGroupDetail);
groupRouter.post("/:id/members", addMember);
groupRouter.delete("/:id/members/:userId", removeMember);
groupRouter.post("/:id/dissolve", dissolveGroup);
groupRouter.get("/:id/messages", getGroupMessages);
groupRouter.post("/:id/messages", sendGroupMessage);
