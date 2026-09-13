import { io, type Socket } from "socket.io-client";

import { API_URL, getToken } from "@/lib/api-client";

let socket: Socket | null = null;

function getSocketURL() {
  if (!API_URL) {
    throw new Error("Socket.IO requires VITE_API_URL to be configured.");
  }

  // Axios uses /api, but Socket.IO connects to the server root.
  return API_URL.replace(/\/api\/?$/, "");
}

export function getSocket(): Socket {
  if (socket) {
    return socket;
  }

  const socketURL = getSocketURL();

  socket = io(socketURL, {
    autoConnect: false,
    withCredentials: true,

    auth: (cb) => {
      const token = getToken();

      cb({
        token: token ?? undefined,
      });
    },
  });

  return socket;
}

export function connectSocket(): Socket {
  const instance = getSocket();

  if (!instance.connected) {
    instance.connect();
  }

  return instance;
}

export function disconnectSocket() {
  if (!socket) {
    return;
  }

  socket.disconnect();
  socket = null;
}