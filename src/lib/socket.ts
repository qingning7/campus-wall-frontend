import { io, type Socket } from "socket.io-client";
import { getAuthToken } from "./api";

const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: {
        token: getAuthToken(),
      },
    });
  }

  return socket;
}

export function resetSocket() {
  socket?.disconnect();
  socket = null;
}
