import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGO_URI: z.string().default("mongodb://localhost:27017/uni-mate"),
  JWT_ACCESS_SECRET: z.string().default("dev_access_secret_unimate_123456"),
  JWT_REFRESH_SECRET: z.string().default("dev_refresh_secret_unimate_123456"),
  ACCESS_TOKEN_TTL: z.string().default("15m"),
  REFRESH_TOKEN_TTL: z.string().default("30d"),
  COOKIE_SECURE: z.coerce.boolean().default(false),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  MAIL_FROM: z.string().default("UNI-MATE <no-reply@uni-mate.local>"),
  OTP_EXPIRES_MINUTES: z.coerce.number().default(5),
  OTP_RESEND_COOLDOWN_SECONDS: z.coerce.number().default(60),
  OTP_MAX_ATTEMPTS: z.coerce.number().default(5),
  OTP_MAX_SEND_PER_HOUR: z.coerce.number().default(5),
  DEV_PRINT_OTP: z.coerce.boolean().default(true),
  GOOGLE_MAPS_API_KEY: z.string().optional(),
  OSRM_BASE_URL: z.string().default("https://router.project-osrm.org"),
  OSRM_PROFILE: z.string().default("driving"),
  DISTANCE_R_PREFILTER_METERS: z.coerce.number().default(10000),
  DISTANCE_T50_MINUTES: z.coerce.number().default(15),
  DISTANCE_TMAX_MINUTES: z.coerce.number().default(45),
  DISTANCE_CANDIDATE_LIMIT: z.coerce.number().default(50),
  DISTANCE_RDR_THRESHOLD: z.coerce.number().default(2.5),
  DISTANCE_CITY_SPEED_KMH: z.coerce.number().default(25),
  UPLOAD_BASE_URL: z.string().default("http://localhost:5000/uploads")
});

export const env = envSchema.parse(process.env);
