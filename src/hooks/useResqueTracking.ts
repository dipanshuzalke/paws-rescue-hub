import { useEffect, useRef, useState } from "react";
import { connectSocket } from "@/lib/socket";
import L from "leaflet";
import type { LiveLocation } from "@/hooks/useLiveLocation";

interface TrackingResponse {
  success: boolean;
  message?: string;
}

export function useRescueTracking(
  rescueId: string | undefined,
  enabled: boolean,
  location: LiveLocation | null,
) {
  const [trackingStarted, setTrackingStarted] = useState(false);

  const startedRef = useRef(false);
  const rescueIdRef = useRef<string | undefined>(rescueId);

  useEffect(() => {
    rescueIdRef.current = rescueId;
  }, [rescueId]);

  useEffect(() => {
    console.log("[tracking] EFFECT:", {
      rescueId,
      enabled,
    });

    if (!rescueId || !enabled) {
      console.log("[tracking] Not starting:", {
        rescueId,
        enabled,
      });

      setTrackingStarted(false);
      startedRef.current = false;

      return;
    }

    const socket = connectSocket();

    console.log("[tracking] Socket state:", {
      connected: socket.connected,
      socketId: socket.id,
      rescueId,
    });

    let mounted = true;

    const startTracking = () => {
      if (!mounted) return;

      console.log(
        "[tracking] Sending rescue_tracking_start:",
        rescueId,
      );

      socket.emit(
        "rescue_tracking_start",
        rescueId,
        (response: TrackingResponse) => {
          console.log(
            "[tracking] Start response:",
            response,
          );

          if (!mounted) return;

          if (!response.success) {
            console.error(
              "[tracking] Failed to start:",
              response.message,
            );

            setTrackingStarted(false);
            startedRef.current = false;

            return;
          }

          startedRef.current = true;
          setTrackingStarted(true);

          console.log(
            "[tracking] Successfully started:",
            rescueId,
          );
        },
      );
    };

    if (socket.connected) {
      console.log(
        "[tracking] Socket already connected. Starting immediately.",
      );

      startTracking();
    } else {
      console.log(
        "[tracking] Waiting for socket connection...",
      );

      socket.once("connect", startTracking);
    }

    return () => {
      mounted = false;

      socket.off("connect", startTracking);

      if (startedRef.current) {
        console.log(
          "[tracking] Stopping tracking:",
          rescueId,
        );

        socket.emit(
          "rescue_tracking_stop",
          rescueId,
          (response: TrackingResponse) => {
            console.log(
              "[tracking] Stop response:",
              response,
            );
          },
        );
      }

      startedRef.current = false;
      setTrackingStarted(false);
    };
  }, [rescueId, enabled]);

  /**
   * Send GPS location whenever a new GPS position arrives.
   */
  useEffect(() => {
    if (
      !rescueId ||
      !enabled ||
      !trackingStarted ||
      !location
    ) {
      return;
    }

    const socket = connectSocket();

    if (!socket.connected) {
      console.warn(
        "[tracking] Cannot send location. Socket disconnected.",
      );
      return;
    }

    const payload = {
      rescueId,

      lat: location.lat,
      lng: location.lng,

      accuracy: location.accuracy ?? null,
      heading: location.heading ?? null,
      speed: location.speed ?? null,
    };

    console.log(
      "[tracking] Sending GPS location:",
      payload,
    );

    socket.emit(
      "rescue_location_update",
      payload,
      (response: TrackingResponse) => {
        if (!response.success) {
          console.error(
            "[tracking] Location update failed:",
            response.message,
          );
        }
      },
    );
  }, [
    rescueId,
    enabled,
    trackingStarted,
    location,
  ]);

  return {
    trackingStarted,
  };
}