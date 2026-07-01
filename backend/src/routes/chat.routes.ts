import { Router } from "express";
import { getRoom, listRooms, sendMessage } from "../controllers/chat.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { messageSchema } from "../validations/common.validation.js";

export const chatRouter = Router();
chatRouter.use(requireAuth);
chatRouter.get("/", listRooms);
chatRouter.get("/:roomId", getRoom);
chatRouter.post("/:roomId/messages", validate(messageSchema), sendMessage);
