import { Router } from "express";
import { feedController, incomingLikesController, likeController, passController } from "../controllers/discovery.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { targetUserSchema } from "../validations/common.validation.js";

export const discoveryRouter = Router();
discoveryRouter.use(requireAuth);
discoveryRouter.get("/", feedController);
discoveryRouter.get("/incoming-likes", incomingLikesController);
discoveryRouter.post("/like", validate(targetUserSchema), likeController);
discoveryRouter.post("/pass", validate(targetUserSchema), passController);
