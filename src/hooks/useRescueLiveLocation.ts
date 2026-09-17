import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import type { LiveLocation } from "@/hooks/useLiveLocation";

interface JoinResponse {
  success: boolean;
  room?: string;
  message?: string;
  trackingActive?: boolean;
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

interface TrackingStatePayload {
  rescueId: string;
  rescuerId: string;
  rescuerName: string;
  location: RescueLocationPayload | null;
  startedAt: string;
}

interface TrackingStoppedPayload {
  rescueId: string;
  rescuerId?: string;
  rescuerName?: string;
  stoppedAt?: string;
  reason?: string;
}

export function useRescueLiveLocation(rescueId?: string) {
  const [rescuerLocation, setRescuerLocation] =
    useState<LiveLocation | null>(null);

  const [rescuerName, setRescuerName] =
    useState<string | null>(null);

  const [tracking, setTracking] =
    useState(false);

  useEffect(() => {
    if (!rescueId) {
      setRescuerLocation(null);
      setRescuerName(null);
      setTracking(false);
      return;
    }

    let mounted = true;

    const socket = connectSocket();

    console.log(
      "[citizen] Socket connected:",
      socket.connected,
    );

    console.log(
      "[citizen] Socket ID:",
      socket.id,
    );

    console.log(
      "[citizen] Rescue ID:",
      rescueId,
    );

    /**
     * ========================================================
     * TRACKING STARTED
     * ========================================================
     *
     * Fired when rescuer starts live tracking.
     */
    const handleTrackingStarted = (
      payload: TrackingStartedPayload,
    ) => {
      console.log(
        "[citizen] TRACKING STARTED:",
        payload,
      );

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        console.log(
          "[citizen] Ignoring tracking-start event for different rescue:",
          payload.rescueId,
        );

        return;
      }

      setTracking(true);

      setRescuerName(
        payload.rescuerName,
      );
    };


    /**
     * ========================================================
     * CURRENT TRACKING STATE
     * ========================================================
     *
     * NEW EVENT
     *
     * This is sent by the backend when this socket joins
     * a rescue that is ALREADY being tracked.
     *
     * This solves:
     *
     * Rescuer starts tracking
     *        ↓
     * NGO refreshes page
     *        ↓
     * NGO missed tracking_started
     *        ↓
     * Backend sends current state
     *        ↓
     * NGO gets current rescuer location
     */
    const handleTrackingState = (
      payload: TrackingStatePayload,
    ) => {
      console.log(
        "[citizen] CURRENT TRACKING STATE:",
        payload,
      );

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        console.log(
          "[citizen] Ignoring tracking state for different rescue:",
          payload.rescueId,
        );

        return;
      }

      /**
       * Tracking is active.
       */
      setTracking(true);

      /**
       * Set rescuer name.
       */
      setRescuerName(
        payload.rescuerName ?? null,
      );

      /**
       * The rescuer may have started tracking but
       * not sent the first GPS location yet.
       */
      if (!payload.location) {
        console.log(
          "[citizen] Tracking is active but no GPS location is available yet.",
        );

        setRescuerLocation(null);

        return;
      }

      /**
       * We have a current GPS location.
       */
      console.log(
        "[citizen] Restoring rescuer marker:",
        payload.location.lat,
        payload.location.lng,
      );

      setRescuerLocation({
        lat: payload.location.lat,
        lng: payload.location.lng,
        accuracy:
          payload.location.accuracy ?? 0,
        heading:
          payload.location.heading ?? null,
        speed:
          payload.location.speed ?? null,
      });
    };


    /**
     * ========================================================
     * LIVE LOCATION UPDATED
     * ========================================================
     *
     * Fired every time the rescuer sends a new GPS position.
     */
    const handleLocationUpdated = (
      payload: RescueLocationPayload,
    ) => {
      console.log(
        "[citizen] LIVE LOCATION RECEIVED:",
        payload,
      );

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        console.log(
          "[citizen] Ignoring location for different rescue:",
          payload.rescueId,
        );

        return;
      }

      console.log(
        "[citizen] Updating rescuer marker:",
        payload.lat,
        payload.lng,
      );

      /**
       * Tracking is definitely active because
       * we're receiving GPS.
       */
      setTracking(true);

      setRescuerName(
        payload.rescuerName,
      );

      setRescuerLocation({
        lat: payload.lat,
        lng: payload.lng,
        accuracy:
          payload.accuracy ?? 0,
        heading:
          payload.heading ?? null,
        speed:
          payload.speed ?? null,
      });
    };


    /**
     * ========================================================
     * TRACKING STOPPED
     * ========================================================
     */
    const handleTrackingStopped = (
      payload: TrackingStoppedPayload,
    ) => {
      console.log(
        "[citizen] TRACKING STOPPED:",
        payload,
      );

      if (!mounted) return;

      if (payload.rescueId !== rescueId) {
        return;
      }

      setTracking(false);

      setRescuerLocation(null);

      /**
       * Keep the rescuer name if you want it displayed
       * after tracking stops.
       *
       * If you prefer clearing it, uncomment:
       *
       * setRescuerName(null);
       */
    };


    /**
     * ========================================================
     * JOIN RESCUE ROOM
     * ========================================================
     */
    const joinRoom = () => {
      if (!mounted) return;

      console.log(
        "[citizen] Joining rescue room:",
        rescueId,
      );

      socket.emit(
        "join_rescue",
        rescueId,
        (response: JoinResponse) => {
          if (!mounted) return;

          console.log(
            "[citizen] Join response:",
            response,
          );

          if (!response.success) {
            console.error(
              "[citizen] Failed to join rescue:",
              response.message,
            );

            return;
          }

          console.log(
            "[citizen] JOINED ROOM:",
            response.room,
            "SOCKET:",
            socket.id,
          );

          /**
           * Backend also tells us whether active tracking
           * exists.
           *
           * The actual current state arrives through:
           *
           * rescue_tracking_state
           */
          console.log(
            "[citizen] Tracking active:",
            response.trackingActive,
          );
        },
      );
    };


    /**
     * ========================================================
     * SOCKET CONNECTED
     * ========================================================
     */
    const handleConnect = () => {
      console.log(
        "[citizen] Socket connected:",
        socket.id,
      );

      /**
       * Rejoin after reconnect.
       */
      joinRoom();
    };


    /**
     * ========================================================
     * SOCKET DISCONNECTED
     * ========================================================
     */
    const handleDisconnect = (
      reason: string,
    ) => {
      console.log(
        "[citizen] Socket disconnected:",
        reason,
      );

      if (!mounted) return;

      setTracking(false);

      setRescuerLocation(null);
    };


    /**
     * ========================================================
     * REGISTER LISTENERS
     * ========================================================
     *
     * IMPORTANT:
     * Register listeners BEFORE attempting to join.
     */
    socket.on(
      "rescue_tracking_started",
      handleTrackingStarted,
    );

    socket.on(
      "rescue_tracking_state",
      handleTrackingState,
    );

    socket.on(
      "rescue_location_updated",
      handleLocationUpdated,
    );

    socket.on(
      "rescue_tracking_stopped",
      handleTrackingStopped,
    );

    socket.on(
      "connect",
      handleConnect,
    );

    socket.on(
      "disconnect",
      handleDisconnect,
    );


    /**
     * ========================================================
     * DEBUG ALL SOCKET EVENTS
     * ========================================================
     *
     * Keep this while testing.
     */
    const handleAnyEvent = (
      event: string,
      ...args: unknown[]
    ) => {
      console.log(
        "[citizen] SOCKET EVENT:",
        event,
        args,
      );
    };

    socket.onAny(handleAnyEvent);


    /**
     * ========================================================
     * JOIN IF ALREADY CONNECTED
     * ========================================================
     */
    if (socket.connected) {
      joinRoom();
    }


    /**
     * ========================================================
     * CLEANUP
     * ========================================================
     */
    return () => {
      mounted = false;

      console.log(
        "[citizen] Cleaning up rescue listeners:",
        rescueId,
      );

      socket.off(
        "rescue_tracking_started",
        handleTrackingStarted,
      );

      socket.off(
        "rescue_tracking_state",
        handleTrackingState,
      );

      socket.off(
        "rescue_location_updated",
        handleLocationUpdated,
      );

      socket.off(
        "rescue_tracking_stopped",
        handleTrackingStopped,
      );

      socket.off(
        "connect",
        handleConnect,
      );

      socket.off(
        "disconnect",
        handleDisconnect,
      );

      socket.offAny(
        handleAnyEvent,
      );

      /**
       * Leave only this rescue room.
       */
      socket.emit(
        "leave_rescue",
        rescueId,
      );

      console.log(
        "[citizen] Left rescue room:",
        rescueId,
      );
    };
  }, [rescueId]);

  return {
    rescuerLocation,
    rescuerName,
    tracking,
  };
}