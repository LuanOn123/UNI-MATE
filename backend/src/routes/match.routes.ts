import { Router } from "express";
import { cancelMatch, confirmPlace, getMatch, listMatches, placeSuggestions, rejectPlace, selectPlace } from "../controllers/match.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { matchPlaceSchema } from "../validations/common.validation.js";

export const matchRouter = Router();
matchRouter.use(requireAuth);
matchRouter.get("/", listMatches);
matchRouter.get("/:matchId", getMatch);
matchRouter.get("/:matchId/place-suggestions", placeSuggestions);
matchRouter.post("/:matchId/select-place", validate(matchPlaceSchema), selectPlace);
matchRouter.post("/:matchId/confirm-place", confirmPlace);
matchRouter.post("/:matchId/reject-place", rejectPlace);
matchRouter.post("/:matchId/cancel", cancelMatch);
