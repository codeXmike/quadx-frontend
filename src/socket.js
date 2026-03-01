import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:4000";

export const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true
});

export function connectSocket(token) {
  if (token && token !== "cookie") {
    socket.auth = { token };
  } else {
    socket.auth = {};
  }
  if (!socket.connected) socket.connect();
}

export function disconnectSocket() {
  if (socket.connected) socket.disconnect();
}
