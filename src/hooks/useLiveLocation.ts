import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet-routing-machine";
import type { GeoPoint } from "@/types";
import { useMap } from "react-leaflet";

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
  showNavigation = false,
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

  /**
   * true  → Rescuer
   * false → Citizen / NGO / Admin
   */
  showNavigation?: boolean;
}) {
  const map = useMap();

  const routingControlRef =
    useRef<L.Routing.Control | null>(null);

  const routeRef = useRef<any>(null);

  const instructionsRef =
    useRef<any[]>([]);

  const currentInstructionRef =
    useRef(0);

  const latestLocationRef =
    useRef<LiveLocation | null>(null);

  const offRouteCountRef =
    useRef(0);

  const lastRerouteAtRef =
    useRef(0);

  const [routeRequest, setRouteRequest] =
    useState(0);

  /*
   * Always keep latest GPS position.
   */
  useEffect(() => {
    latestLocationRef.current =
      liveLocation;
  }, [liveLocation]);

  /*
   * Start initial route once GPS becomes available.
   *
   * Does NOT recreate route on every GPS update.
   */
  useEffect(() => {
    if (!liveLocation || !destination) {
      return;
    }

    if (
      routingControlRef.current ||
      routeRef.current
    ) {
      return;
    }

    setRouteRequest(
      (current) => current + 1,
    );
  }, [liveLocation, destination]);

  /*
   * Create route.
   */
  useEffect(() => {
    const location =
      latestLocationRef.current;

    if (!location || !destination) {
      if (showNavigation) {
        onRouteInfo?.(null);
      }

      return;
    }

    if (routingControlRef.current) {
      return;
    }

    routeRef.current = null;

    instructionsRef.current = [];

    currentInstructionRef.current = 0;

    const routingOptions: any = {
      waypoints: [
        L.latLng(
          location.lat,
          location.lng,
        ),
        L.latLng(
          destination.lat,
          destination.lng,
        ),
      ],

      routeWhileDragging: false,

      addWaypoints: false,

      fitSelectedRoutes: false,

      showAlternatives: false,

      show: false,

      /*
       * IMPORTANT
       *
       * Prevent Leaflet Routing Machine from
       * creating its own waypoint markers.
       */
      createMarker: () => null,

      lineOptions: {
        styles: [
          {
            color: "#2563eb",
            opacity: 0.85,
            weight: 6,
          },
        ],
      },
    };

    const routingControl =
      L.Routing
        .control(routingOptions)
        .addTo(map);

    routingControlRef.current =
      routingControl;

    const handleRoutesFound = (
      event: any,
    ) => {
      const route =
        event.routes?.[0];

      if (!route) {
        if (showNavigation) {
          onRouteInfo?.(null);
        }

        return;
      }

      routeRef.current = route;

      const instructions =
        route.instructions ?? [];

      instructionsRef.current =
        instructions;

      currentInstructionRef.current =
        0;

      offRouteCountRef.current =
        0;

      if (showNavigation) {
        onOffRoute?.(false);
      }

      /*
       * If navigation is disabled,
       * DO NOT send navigation information.
       */
      if (!showNavigation) {
        return;
      }

      const firstInstruction =
        instructions[0];

      /*
       * No instructions available.
       */
      if (!firstInstruction) {
        onRouteInfo?.({
          instruction:
            "Continue straight",

          distanceMeters:
            route.summary
              ?.totalDistance ?? 0,

          totalDistanceMeters:
            route.summary
              ?.totalDistance ?? 0,

          totalTimeSeconds:
            route.summary
              ?.totalTime ?? 0,
        });

        return;
      }

      const coordinates =
        route.coordinates ?? [];

      const maneuverPoint =
        coordinates[
          firstInstruction.index
        ];

      let distanceToManeuver =
        firstInstruction.distance ?? 0;

      if (maneuverPoint) {
        distanceToManeuver =
          calculateDistanceKm(
            location,
            {
              lat: maneuverPoint.lat,
              lng: maneuverPoint.lng,
            },
          ) * 1000;
      }

      const formatted =
        formatNavigationInstruction(
          firstInstruction.text ??
            "Continue straight",
        );

      onRouteInfo?.({
        instruction:
          formatted.text,

        distanceMeters:
          distanceToManeuver,

        totalDistanceMeters:
          route.summary
            ?.totalDistance ?? 0,

        totalTimeSeconds:
          route.summary
            ?.totalTime ?? 0,
      });
    };

    routingControl.on(
      "routesfound",
      handleRoutesFound,
    );

    return () => {
      (
        routingControl as any
      ).off(
        "routesfound",
        handleRoutesFound,
      );

      if (
        routingControlRef.current ===
        routingControl
      ) {
        map.removeControl(
          routingControl,
        );

        routingControlRef.current =
          null;
      }
    };
  }, [
    routeRequest,
    destination?.lat,
    destination?.lng,
    map,
    onRouteInfo,
    onOffRoute,
    showNavigation,
  ]);

  /*
   * Update route using existing route.
   *
   * GPS updates DO NOT recreate route.
   */
  useEffect(() => {
    if (!liveLocation) {
      return;
    }

    const route =
      routeRef.current;

    const instructions =
      instructionsRef.current;

    if (
      !route ||
      !instructions.length
    ) {
      return;
    }

    const coordinates =
      route.coordinates ?? [];

    if (!coordinates.length) {
      return;
    }

    /*
     * ========================================================
     * OFF-ROUTE DETECTION
     * ========================================================
     *
     * Only relevant for navigation.
     */
    const distanceFromRoute =
      distanceToRouteMeters(
        liveLocation,
        coordinates,
      );

    if (
      distanceFromRoute >
      OFF_ROUTE_THRESHOLD_METERS
    ) {
      offRouteCountRef.current += 1;
    } else {
      offRouteCountRef.current = 0;

      if (showNavigation) {
        onOffRoute?.(false);
      }
    }

    /*
     * Require 3 consecutive off-route
     * GPS readings.
     */
    if (
      offRouteCountRef.current >= 3
    ) {
      const now = Date.now();

      /*
       * Don't recalculate more than
       * once every 10 seconds.
       */
      if (
        now -
          lastRerouteAtRef.current >
        10000
      ) {
        lastRerouteAtRef.current =
          now;

        offRouteCountRef.current =
          0;

        if (showNavigation) {
          onOffRoute?.(true);
        }

        /*
         * Remove old route.
         */
        if (
          routingControlRef.current
        ) {
          map.removeControl(
            routingControlRef.current,
          );

          routingControlRef.current =
            null;
        }

        routeRef.current = null;

        instructionsRef.current = [];

        currentInstructionRef.current =
          0;

        /*
         * Recalculate route using
         * latest GPS location.
         */
        setRouteRequest(
          (current) => current + 1,
        );

        return;
      }
    }

    /*
     * ========================================================
     * IMPORTANT
     *
     * Citizen / NGO / Admin:
     *
     * We don't need to calculate or send
     * turn-by-turn navigation information.
     *
     * The route itself can still remain
     * visible.
     * ========================================================
     */
    if (!showNavigation) {
      return;
    }

    /*
     * ========================================================
     * CURRENT MANEUVER
     * ========================================================
     */
    const currentIndex =
      currentInstructionRef.current;

    const currentInstruction =
      instructions[currentIndex];

    if (!currentInstruction) {
      return;
    }

    const maneuverPoint =
      coordinates[
        currentInstruction.index
      ];

    if (!maneuverPoint) {
      return;
    }

    /*
     * Calculate live distance to maneuver.
     */
    const distanceToManeuver =
      calculateDistanceKm(
        liveLocation,
        {
          lat: maneuverPoint.lat,
          lng: maneuverPoint.lng,
        },
      ) * 1000;

    /*
     * Only change instruction when
     * rescuer reaches the maneuver.
     */
    if (
      distanceToManeuver <= 25 &&
      currentIndex <
        instructions.length - 1
    ) {
      const nextIndex =
        currentIndex + 1;

      currentInstructionRef.current =
        nextIndex;

      const nextInstruction =
        instructions[nextIndex];

      const nextManeuverPoint =
        coordinates[
          nextInstruction.index
        ];

      let nextDistance =
        nextInstruction.distance ?? 0;

      if (nextManeuverPoint) {
        nextDistance =
          calculateDistanceKm(
            liveLocation,
            {
              lat:
                nextManeuverPoint.lat,
              lng:
                nextManeuverPoint.lng,
            },
          ) * 1000;
      }

      const formatted =
        formatNavigationInstruction(
          nextInstruction.text ??
            "Continue straight",
        );

      onRouteInfo?.({
        instruction:
          formatted.text,

        distanceMeters:
          nextDistance,

        totalDistanceMeters:
          route.summary
            ?.totalDistance ?? 0,

        totalTimeSeconds:
          route.summary
            ?.totalTime ?? 0,
      });

      return;
    }

    /*
     * Same instruction.
     *
     * Only distance changes.
     */
    const formatted =
      formatNavigationInstruction(
        currentInstruction.text ??
          "Continue straight",
      );

    onRouteInfo?.({
      instruction:
        formatted.text,

      distanceMeters:
        distanceToManeuver,

      totalDistanceMeters:
        route.summary
          ?.totalDistance ?? 0,

      totalTimeSeconds:
        route.summary
          ?.totalTime ?? 0,
    });
  }, [
    liveLocation,
    map,
    onRouteInfo,
    onOffRoute,
    showNavigation,
  ]);

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
