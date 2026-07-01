import { Router } from "express";
import { getPlace, listPlaces } from "../controllers/places.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const placesRouter = Router();
placesRouter.use(requireAuth);
placesRouter.get("/", listPlaces);
placesRouter.get("/:placeId", getPlace);
