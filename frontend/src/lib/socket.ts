import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "../stores/authStore";

let socket: Socket | null = null;

export function getSocket() {
  const token = useAuthStore.getState().accessToken;
  if (!socket) {
    socket = io(import.meta.env.VITE_SOCKET_URL ?? "http://localhost:5000", {
      autoConnect: false,
      auth: { token }
    });
  }
  socket.auth = { token };
  if (!socket.connected) socket.connect();
  return socket;
}
