import { useEffect, useRef, useState } from "react";
import "leaflet-routing-machine";
import type { GeoPoint } from "@/types";
import { useMap } from "react-leaflet";
import L from "leaflet";

const OFF_ROUTE_THRESHOLD_METERS = 50;

export interface LiveLocation {
  lat: number;
  lng: number;
  accuracy: number;
  heading: number | null;
  speed: number | null;
}

export function useLiveLocation(enabled: boolean) {
  const [location, setLocation] = useState<LiveLocation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (!navigator.geolocation) {
      setError("Geolocation is not supported by this browser.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed,
        });

        setError(null);
      },
      (geoError) => {
        switch (geoError.code) {
          case geoError.PERMISSION_DENIED:
            setError("Location permission was denied.");
            break;

          case geoError.POSITION_UNAVAILABLE:
            setError("Unable to determine your current location.");
            break;

          case geoError.TIMEOUT:
            setError("Location request timed out.");
            break;

          default:
            setError("Unable to access your location.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000,
      },
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [enabled]);

  return {
    location,
    error,
  };
}

export function calculateDistanceKm(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;

  const lat1 = (from.lat * Math.PI) / 180;
  const lat2 = (to.lat * Math.PI) / 180;
  const deltaLat = ((to.lat - from.lat) * Math.PI) / 180;
  const deltaLng = ((to.lng - from.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusKm * c;
}

export function distanceToRouteMeters(
  location: LiveLocation,
  coordinates: Array<{ lat: number; lng: number }>,
) {
  if (!coordinates.length) {
    return Infinity;
  }

  let minimumDistance = Infinity;

  for (const point of coordinates) {
    const distance = calculateDistanceKm(location, point) * 1000;

    if (distance < minimumDistance) {
      minimumDistance = distance;
    }
  }

  return minimumDistance;
}

export function LiveRoute({
  liveLocation,
  destination,
  onRouteInfo,
  onOffRoute,
}: {
  liveLocation: LiveLocation | null;
  destination: GeoPoint | undefined;
  onRouteInfo?: (
    info: {
      instruction: string;
      distanceMeters: number;
      totalDistanceMeters: number;
      totalTimeSeconds: number;
    } | null,
  ) => void;
  onOffRoute?: (offRoute: boolean) => void;
}) {
  const map = useMap();

  const routingControlRef = useRef<L.Routing.Control | null>(null);
  const routeRef = useRef<any>(null);

  const instructionsRef = useRef<any[]>([]);
  const currentInstructionRef = useRef(0);

  const offRouteCountRef = useRef(0);

  /*
   * Create route whenever the current GPS position
   * or destination changes.
   *
   * This restores the working route/instruction behavior.
   */
  useEffect(() => {
    if (!liveLocation || !destination) {
      onRouteInfo?.(null);
      return;
    }

    if (routingControlRef.current) {
      map.removeControl(routingControlRef.current);
      routingControlRef.current = null;
    }

    const routingControl = L.Routing.control({
      waypoints: [
        L.latLng(liveLocation.lat, liveLocation.lng),
        L.latLng(destination.lat, destination.lng),
      ],

      routeWhileDragging: false,
      addWaypoints: false,
      fitSelectedRoutes: false,
      showAlternatives: false,
      show: false,

      lineOptions: {
        styles: [
          {
            color: "#2563eb",
            opacity: 0.85,
            weight: 6,
          },
        ],
      } as any,
    }).addTo(map);

    routingControlRef.current = routingControl;

    const handleRoutesFound = (event: any) => {
      const route = event.routes?.[0];

      if (!route) {
        onRouteInfo?.(null);
        return;
      }

      routeRef.current = route;

      const instructions = route.instructions ?? [];

      instructionsRef.current = instructions;
      currentInstructionRef.current = 0;
      offRouteCountRef.current = 0;

      onOffRoute?.(false);

      const firstInstruction = instructions[0];

      if (!firstInstruction) {
        onRouteInfo?.({
          instruction: "Continue straight",
          distanceMeters: 0,
          totalDistanceMeters: route.summary?.totalDistance ?? 0,
          totalTimeSeconds: route.summary?.totalTime ?? 0,
        });

        return;
      }

      const formatted = formatNavigationInstruction(firstInstruction.text ?? "Continue straight");

      onRouteInfo?.({
        instruction: formatted.text,
        distanceMeters: firstInstruction.distance ?? 0,
        totalDistanceMeters: route.summary?.totalDistance ?? 0,
        totalTimeSeconds: route.summary?.totalTime ?? 0,
      });
    };

    routingControl.on("routesfound", handleRoutesFound);

    return () => {
      (routingControl as any).off("routesfound", handleRoutesFound);

      if (routingControlRef.current) {
        map.removeControl(routingControlRef.current);
        routingControlRef.current = null;
      }
    };
  }, [liveLocation, destination, map]);

  /*
   * Move to the next turn when the rescuer
   * reaches the current maneuver.
   */
  useEffect(() => {
    if (!liveLocation) {
      return;
    }

    const instructions = instructionsRef.current;
    const coordinates = routeRef.current?.coordinates;

    if (!instructions.length || !coordinates?.length) {
      return;
    }

    const currentIndex = currentInstructionRef.current;
    const currentInstruction = instructions[currentIndex];

    if (!currentInstruction) {
      return;
    }

    const maneuverPoint = coordinates[currentInstruction.index];

    if (!maneuverPoint) {
      return;
    }

    const distanceToManeuver =
      calculateDistanceKm(liveLocation, {
        lat: maneuverPoint.lat,
        lng: maneuverPoint.lng,
      }) * 1000;

    if (distanceToManeuver <= 25) {
      if (currentIndex < instructions.length - 1) {
        const nextIndex = currentIndex + 1;

        currentInstructionRef.current = nextIndex;

        const nextInstruction = instructions[nextIndex];

        const formatted = formatNavigationInstruction(nextInstruction.text ?? "Continue straight");

        onRouteInfo?.({
          instruction: formatted.text,
          distanceMeters: nextInstruction.distance ?? 0,
          totalDistanceMeters: routeRef.current?.summary?.totalDistance ?? 0,
          totalTimeSeconds: routeRef.current?.summary?.totalTime ?? 0,
        });
      }
    }
  }, [liveLocation, onRouteInfo]);

  return null;
}

export function formatNavigationInstruction(instruction: string) {
  const text = instruction.trim();

  if (/head west/i.test(text)) {
    return {
      text: "Turn left",
      icon: "←",
    };
  }

  if (/head east/i.test(text)) {
    return {
      text: "Turn right",
      icon: "→",
    };
  }

  if (/head north/i.test(text)) {
    return {
      text: "Continue straight",
      icon: "↑",
    };
  }

  if (/head south/i.test(text)) {
    return {
      text: "Continue straight",
      icon: "↓",
    };
  }

  if (/turn left/i.test(text)) {
    return {
      text,
      icon: "←",
    };
  }

  if (/turn right/i.test(text)) {
    return {
      text,
      icon: "→",
    };
  }

  return {
    text,
    icon: "↑",
  };
}
