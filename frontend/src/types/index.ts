export type Role = "user" | "admin" | "partner";

export type User = {
  id?: string;
  _id?: string;
  email: string;
  role: Role;
  status?: "active" | "suspended" | "banned";
  displayName?: string;
  avatarUrl?: string;
  age?: number;
  birthDate?: string;
  zodiac?: string;
  gender?: string;
  school?: string;
  major?: string;
  profilePhotos?: string[];
  onboardingCompleted: boolean;
  twoFactorEnabled?: boolean;
  onboarding?: Record<string, any>;
  location?: { coordinates: [number, number]; addressLabel?: string; source?: "gps" | "manual" };
  matchMeta?: {
    score: number;
    reasons: string[];
    commonTags: string[];
    commonCafeStyles: string[];
    distanceScore?: number;
    distanceMeters?: number | null;
    durationSeconds?: number | null;
    durationMinutes?: number | null;
    rdr?: number | null;
    barrierSensitive?: boolean;
  };
};

export type Place = {
  _id: string;
  name: string;
  address?: string;
  rating?: number;
  userRatingsTotal?: number;
  city?: string;
  district?: string;
  priceLevel?: string;
  status?: "active" | "hidden" | "pending";
  tags?: string[];
  amenities?: string[];
  openingHours?: string;
  description?: string;
  imageUrl?: string;
  openNow?: boolean;
  mapsUrl?: string;
};

export type Match = {
  _id: string;
  users: User[];
  status: "matched" | "cafe_proposed" | "cafe_confirmed" | "chat_opened" | "expired" | "blocked" | "cancelled";
  selectedPlace?: Place;
  selectedBy?: string;
  confirmedBy: string[];
  chatRoom?: ChatRoom | string;
  score: number;
  reasons: string[];
};

export type ChatRoom = {
  _id: string;
  match: Match | string;
  users: User[];
  place?: Place;
  status: "active" | "blocked" | "archived";
  lastMessage?: string;
  lastMessageAt?: string;
};

export type Message = {
  _id: string;
  room: string;
  sender: User | string;
  senderId?: string;
  mine?: boolean;
  text: string;
  type?: "text" | "image" | "video" | "file";
  fileUrl?: string;
  fileName?: string;
  readBy: string[];
  createdAt: string;
};

export type NotificationItem = {
  _id: string;
  type: "message" | "incoming_like" | "cafe_proposal" | "cafe_rejected" | "match_cancelled" | string;
  title: string;
  body?: string;
  data?: {
    actorId?: string;
    actor?: Partial<User>;
    [key: string]: unknown;
  };
  readAt?: string;
  createdAt: string;
};
