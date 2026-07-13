import { Router } from "express";
import {
  adminActions,
  adminMatches,
  adminPlaces,
  adminReports,
  adminTags,
  adminUserDetail,
  adminUsers,
  createAdminUser,
  dashboard,
  deletePlace,
  hidePlace,
  updateAdminUser,
  updateReport,
  updateUserStatus,
  upsertPlace,
  upsertTag,
  adminPlaceDetail
} from "../controllers/admin.controller.js";
import { requireAdmin, requireAuth } from "../middlewares/auth.js";

export const adminRouter = Router();
adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/dashboard", dashboard);
adminRouter.get("/users", adminUsers);
adminRouter.post("/users", createAdminUser);
adminRouter.get("/users/:userId", adminUserDetail);
adminRouter.put("/users/:userId", updateAdminUser);
adminRouter.patch("/users/:userId/status", updateUserStatus);
adminRouter.get("/reports", adminReports);
adminRouter.patch("/reports/:reportId", updateReport);
adminRouter.get("/matches", adminMatches);
adminRouter.get("/places", adminPlaces);
adminRouter.get("/places-cache", adminPlaces);
adminRouter.get("/places/:placeId", adminPlaceDetail);
adminRouter.post("/places", upsertPlace);
adminRouter.put("/places/:placeId", upsertPlace);
adminRouter.delete("/places/:placeId", deletePlace);
adminRouter.patch("/places/:placeId/status", hidePlace);
adminRouter.get("/tags", adminTags);
adminRouter.post("/tags", upsertTag);
adminRouter.put("/tags/:tagId", upsertTag);
adminRouter.get("/actions", adminActions);
adminRouter.get("/analytics", dashboard);
adminRouter.get("/settings", (_req, res) => res.json({ settings: { moderation: true, cafeGateRequired: true, admin2faRequired: true } }));
