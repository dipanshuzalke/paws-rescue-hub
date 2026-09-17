import { useEffect, useState } from "react";
import { connectSocket } from "@/lib/socket";
import type { LiveLocation } from "@/hooks/useLiveLocation";

export interface AvailableRescuerLocation {
  rescuerId: string;
  rescuerName: string;
  location: LiveLocation;
}

interface LocationPayload {
  rescuerId: string;
  rescuerName: string;
  lat: number;
  lng: number;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  updatedAt: string;
}

export function useAvailableRescuersLocation() {
  const [rescuers, setRescuers] = useState<
    AvailableRescuerLocation[]
  >([]);

  useEffect(() => {
    const socket = connectSocket();

    const handleState = (payload: LocationPayload[]) => {
      console.log("[NGO] Available rescuers state:", payload);

      setRescuers(
        payload.map((rescuer) => ({
          rescuerId: rescuer.rescuerId,
          rescuerName: rescuer.rescuerName,
          location: {
            lat: rescuer.lat,
            lng: rescuer.lng,
            accuracy: rescuer.accuracy ?? 0,
            heading: rescuer.heading ?? null,
            speed: rescuer.speed ?? null,
          },
        })),
      );
    };

    const handleUpdated = (payload: LocationPayload) => {
      console.log("[NGO] Rescuer location updated:", payload);

      setRescuers((current) => {
        const item: AvailableRescuerLocation = {
          rescuerId: payload.rescuerId,
          rescuerName: payload.rescuerName,
          location: {
            lat: payload.lat,
            lng: payload.lng,
            accuracy: payload.accuracy ?? 0,
            heading: payload.heading ?? null,
            speed: payload.speed ?? null,
          },
        };

        const existing = current.findIndex(
          (r) => r.rescuerId === payload.rescuerId,
        );

        if (existing === -1) {
          return [...current, item];
        }

        const next = [...current];
        next[existing] = item;
        return next;
      });
    };

    const handleRemoved = ({
      rescuerId,
    }: {
      rescuerId: string;
    }) => {
      console.log("[NGO] Rescuer removed:", rescuerId);

      setRescuers((current) =>
        current.filter((r) => r.rescuerId !== rescuerId),
      );
    };

    const joinRoom = () => {
      console.log("[NGO] Joining available rescuers room");
      socket.emit("join_available_rescuers");
    };

    socket.on("available_rescuers_state", handleState);
    socket.on(
      "available_rescuer_location_updated",
      handleUpdated,
    );
    socket.on(
      "available_rescuer_location_removed",
      handleRemoved,
    );

    socket.on("connect", joinRoom);

    // Socket may already be connected.
    if (socket.connected) {
      joinRoom();
    }

    return () => {
      socket.off("available_rescuers_state", handleState);
      socket.off(
        "available_rescuer_location_updated",
        handleUpdated,
      );
      socket.off(
        "available_rescuer_location_removed",
        handleRemoved,
      );
      socket.off("connect", joinRoom);
    };
  }, []);

  return rescuers;
}