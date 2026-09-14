import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import type { LiveLocation } from "@/hooks/useLiveLocation";

interface JoinResponse {
  success: boolean;
  room?: string;
  message?: string;
}

interface RescueLocationPayload {
  rescueId: string;
  rescuerId: string;
  rescuerName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updatedAt: string;
}

interface TrackingStartedPayload {
  rescueId: string;
  rescuerId: string;
  rescuerName: string;
  startedAt: string;
}

interface TrackingStoppedPayload {
  rescueId: string;
}

export function useRescueLiveLocation(rescueId?: string) {
  const [rescuerLocation, setRescuerLocation] = useState<LiveLocation | null>(null);

  const [rescuerName, setRescuerName] = useState<string | null>(null);

  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!rescueId) {
      setRescuerLocation(null);
      setRescuerName(null);
      setTracking(false);
      return;
    }

    let mounted = true;

    const socket = connectSocket();

    console.log("[citizen] Socket connected:", socket.connected);
    console.log("[citizen] Socket ID:", socket.id);
    console.log("[citizen] Rescue ID:", rescueId);

    const handleTrackingStarted = (payload: TrackingStartedPayload) => {
      console.log("[citizen] TRACKING STARTED:", payload);

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        console.log(
          "[citizen] Ignoring tracking-start event for different rescue:",
          payload.rescueId,
        );
        return;
      }

      setTracking(true);
      setRescuerName(payload.rescuerName);
    };

    const handleLocationUpdated = (payload: RescueLocationPayload) => {
      console.log("[citizen] LIVE LOCATION RECEIVED:", payload);

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        console.log("[citizen] Ignoring location for different rescue:", payload.rescueId);
        return;
      }

      console.log("[citizen] Updating rescuer marker:", payload.lat, payload.lng);

      setTracking(true);
      setRescuerName(payload.rescuerName);

      setRescuerLocation({
        lat: payload.lat,
        lng: payload.lng,
        accuracy: payload.accuracy ?? 0,
        heading: payload.heading ?? null,
        speed: payload.speed ?? null,
      });
    };

    const handleTrackingStopped = (payload: TrackingStoppedPayload) => {
      console.log("[citizen] TRACKING STOPPED:", payload);

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        return;
      }

      setTracking(false);
      setRescuerLocation(null);
    };

    const joinRoom = () => {
      if (!mounted) return;

      console.log("[citizen] Joining rescue room:", rescueId);

      socket.emit("join_rescue", rescueId, (response: JoinResponse) => {
        if (!mounted) return;

        console.log("[citizen] Join response:", response);

        if (!response.success) {
          console.error("[citizen] Failed to join rescue:", response.message);
          return;
        }

        console.log("[citizen] JOINED ROOM:", response.room, "SOCKET:", socket.id);
      });
    };

    const handleConnect = () => {
      console.log("[citizen] Socket connected:", socket.id);

      joinRoom();
    };

    const handleDisconnect = (reason: string) => {
      console.log("[citizen] Socket disconnected:", reason);

      if (!mounted) return;

      setTracking(false);
      setRescuerLocation(null);
    };

    /*
     * IMPORTANT:
     * Register all listeners BEFORE attempting to join.
     */
    socket.on("rescue_tracking_started", handleTrackingStarted);

    socket.on("rescue_location_updated", handleLocationUpdated);

    socket.on("rescue_tracking_stopped", handleTrackingStopped);

    socket.onAny((event, ...args) => {
      console.log("[citizen] SOCKET EVENT:", event, args);
    });

    socket.on("connect", handleConnect);

    socket.on("disconnect", handleDisconnect);

    /*
     * If already connected, join immediately.
     * Otherwise handleConnect() will join after connection.
     */
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      mounted = false;

      console.log("[citizen] Cleaning up rescue listeners:", rescueId);

      socket.off("rescue_tracking_started", handleTrackingStarted);

      socket.off("rescue_location_updated", handleLocationUpdated);

      socket.off("rescue_tracking_stopped", handleTrackingStopped);

      socket.off("connect", handleConnect);

      socket.off("disconnect", handleDisconnect);

      socket.offAny();

      socket.emit("leave_rescue", rescueId);

      console.log("[citizen] Left rescue room:", rescueId);
    };
  }, [rescueId]);

  return {
    rescuerLocation,
    rescuerName,
    tracking,
  };
}
