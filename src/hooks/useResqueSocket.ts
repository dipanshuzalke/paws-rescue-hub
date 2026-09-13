import { useEffect, useState } from "react";

import { connectSocket } from "@/lib/socket";

interface JoinResponse {
  success: boolean;
  room?: string;
  message?: string;
}

export function useRescueSocket(rescueId?: string) {
  const [connected, setConnected] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rescueId) {
      return;
    }

    let mounted = true;

    const socket = connectSocket();

    const handleConnect = () => {
      if (!mounted) return;

      setConnected(true);
      setError(null);

      socket.emit(
        "join_rescue",
        rescueId,
        (response: JoinResponse) => {
          if (!mounted) return;

          if (response.success) {
            setJoined(true);
            setError(null);
          } else {
            setJoined(false);
            setError(
              response.message ?? "Unable to join rescue room.",
            );
          }
        },
      );
    };

    const handleDisconnect = () => {
      if (!mounted) return;

      setConnected(false);
      setJoined(false);
    };

    const handleConnectError = (err: Error) => {
      if (!mounted) return;

      setConnected(false);
      setJoined(false);
      setError(err.message || "Socket connection failed.");
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);

    if (socket.connected) {
      handleConnect();
    }

    return () => {
      mounted = false;

      socket.emit("leave_rescue", rescueId);

      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
    };
  }, [rescueId]);

  return {
    connected,
    joined,
    error,
  };
}