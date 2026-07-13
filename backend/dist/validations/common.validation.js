import { z } from "zod";
export const targetUserSchema = z.object({ body: z.object({ targetUserId: z.string().min(1) }) });
export const matchPlaceSchema = z.object({
    params: z.object({ matchId: z.string().min(1) }),
    body: z.object({ placeId: z.string().min(1) })
});
export const idParamSchema = z.object({ params: z.record(z.string().min(1)) });
export const messageSchema = z.object({ body: z.object({ text: z.string().min(1).max(2000) }) });
export const reportSchema = z.object({
    body: z.object({
        reportedUser: z.string(),
        match: z.string().optional(),
        room: z.string().optional(),
        message: z.string().optional(),
        reason: z.string().min(1),
        details: z.string().optional(),
        incidentAt: z.string().datetime().optional(),
        evidenceUrls: z.array(z.string().url()).max(3).optional()
    })
});
