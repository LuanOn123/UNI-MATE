import { Router } from "express";
import { getPlace, getPlaceVouchers, listPlaces, registerPartnerPlace } from "../controllers/places.controller.js";
import { requireAuth } from "../middlewares/auth.js";

export const placesRouter = Router();
placesRouter.use(requireAuth);
placesRouter.get("/", listPlaces);
placesRouter.post("/partner-register", registerPartnerPlace);
placesRouter.get("/:placeId", getPlace);
placesRouter.get("/:placeId/vouchers", getPlaceVouchers);
