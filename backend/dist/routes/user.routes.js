import { Router } from "express";
import fs from "node:fs";
import multer from "multer";
import path from "node:path";
import { completeOnboarding, geocodeLocation, getProfile, updateLocation, uploadAvatar, uploadProfilePhoto } from "../controllers/user.controller.js";
import { requireAuth } from "../middlewares/auth.js";
import { validate } from "../middlewares/validate.js";
import { geocodeLocationSchema, locationSchema, onboardingSchema } from "../validations/user.validation.js";
const uploadDir = path.resolve(process.cwd(), "uploads");
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        fs.mkdirSync(uploadDir, { recursive: true });
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`)
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
export const userRouter = Router();
userRouter.use(requireAuth);
userRouter.get("/profile", getProfile);
userRouter.post("/onboarding", validate(onboardingSchema), completeOnboarding);
userRouter.post("/location/geocode", validate(geocodeLocationSchema), geocodeLocation);
userRouter.patch("/location", validate(locationSchema), updateLocation);
userRouter.post("/avatar", upload.single("avatar"), uploadAvatar);
userRouter.post("/photo", upload.single("photo"), uploadProfilePhoto);
