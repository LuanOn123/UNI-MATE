# UNI-MATE

UNI-MATE is a full-stack web app for student friend matching around interests, cafe habits, distance and compatibility scoring. Its main product rule is Cafe-Gated Chat: a mutual match cannot chat until both users confirm the same public cafe.

## Stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router DOM, Zustand, Axios, React Hook Form, Zod, Framer Motion, Socket.IO Client, Lucide React, Firebase SDK-ready env.
- Backend: Node.js, Express, TypeScript, MongoDB, Mongoose, JWT access/refresh tokens, bcryptjs password hashing, optional Email OTP 2FA, cors, dotenv, helmet, morgan, express-rate-limit, cookie-parser, nodemailer, Socket.IO, multer, Google Places API integration, Zod validation.

## Structure

```txt
frontend/
  src/app
  src/components
  src/features
  src/layouts
  src/lib
  src/routes
  src/stores
backend/
  src/config
  src/controllers
  src/middlewares
  src/models
  src/routes
  src/services
  src/sockets
  src/validations
```

## Run Locally

1. Start MongoDB locally or provide a MongoDB Atlas URI.
2. Copy env files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

3. Install and run backend:

```bash
cd backend
npm install
npm run dev
```

4. Install and run frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend: `http://localhost:5173`
Backend: `http://localhost:5000`

Auth uses email + password. User 2FA is optional; admin login requires Email OTP 2FA. In development, OTP codes are printed to the backend console when SMTP is not configured.

## Core API

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/send-otp`
- `POST /api/auth/verify-otp`
- `POST /api/users/onboarding`
- `GET /api/discovery`
- `POST /api/discovery/like`
- `POST /api/discovery/pass`
- `GET /api/matches/:matchId/place-suggestions`
- `POST /api/matches/:matchId/select-place`
- `POST /api/matches/:matchId/confirm-place`
- `GET /api/chat`
- `GET /api/chat/:roomId`
- `GET /api/places`
- `GET /api/places/:placeId`
- `POST /api/safety/report`
- `POST /api/safety/block`
- `GET /api/admin/dashboard`
- `PATCH /api/admin/users/:userId/status`
- `PATCH /api/admin/reports/:reportId`
- `GET /api/admin/places`
- `GET /api/admin/tags`
- `GET /api/admin/actions`

## Notes

- User and place schemas include `2dsphere` geolocation indexes.
- If `GOOGLE_MAPS_API_KEY` is missing, cafe suggestions use cached or seeded fallback places so the flow remains testable.
- Socket.IO supports `join_room`, `send_message`, `typing_start`, `typing_stop`, `mark_read` and emits `new_message`, `message_read`, `user_typing`.
