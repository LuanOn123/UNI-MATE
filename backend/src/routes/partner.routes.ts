import { Router, type Request, type Response, type NextFunction } from "express";
import { createVoucher, deleteVoucher, getMyPlaces, getPlaceVouchers, toggleVoucherStatus, updateMyPlace } from "../controllers/partner.controller.js";
import { requireAuth } from "../middlewares/auth.js";

// Middleware to enforce partner role
const requirePartner = (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== "partner") {
    return res.status(403).json({ message: "Require partner role." });
  }
  next();
};

export const partnerRouter = Router();

partnerRouter.use(requireAuth);
partnerRouter.use(requirePartner as any);

// Places
partnerRouter.get("/places", getMyPlaces);
partnerRouter.patch("/places/:placeId", updateMyPlace);

// Vouchers
partnerRouter.get("/places/:placeId/vouchers", getPlaceVouchers);
partnerRouter.post("/places/:placeId/vouchers", createVoucher);
partnerRouter.patch("/vouchers/:id/toggle", toggleVoucherStatus);
partnerRouter.delete("/vouchers/:id", deleteVoucher);
