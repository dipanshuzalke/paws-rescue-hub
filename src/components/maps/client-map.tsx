import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { GeoPoint } from "@/types";
import type { MapViewProps, MapMarker } from "./map-view";
import {
  calculateDistanceKm,
  formatNavigationInstruction,
  LiveLocation,
  LiveRoute,
  useLiveLocation,
} from "@/hooks/useLiveLocation";

const DEFAULT_CENTER: [number, number] = [21.1458, 79.0882];
const DEFAULT_ZOOM = 14;

const routingContainerStyle = `
  .leaflet-routing-container {
    display: none !important;
  }
`;

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const rescuerIcon = L.divIcon({
  className: "rescuer-vehicle-marker",
  html: `
        <div
            style="
                width: 42px;
                height: 42px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                filter: drop-shadow(0 2px 3px rgba(0,0,0,0.3));
            "
        >
            🚑
        </div>
    `,
  iconSize: [42, 42],
  iconAnchor: [21, 21],
  popupAnchor: [0, -21],
});

function MapCenterController({ markers, tracking }: { markers: MapMarker[]; tracking: boolean }) {
  const map = useMap();

  useEffect(() => {
    // When driving, LiveLocationController handles the map center.
    if (tracking) {
      return;
    }

    const first = markers[0];

    if (!first?.coords) {
      return;
    }

    map.setView([first.coords.lat, first.coords.lng], 16, {
      animate: false,
    });
  }, [markers, tracking, map]);

  return null;
}

function MapClickHandler({ onMapClick }: { onMapClick?: (coords: GeoPoint) => void }) {
  useMapEvents({
    click(event) {
      onMapClick?.({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}

function LiveLocationController({ location }: { location: LiveLocation | null }) {
  const map = useMap();

  useEffect(() => {
    if (!location) {
      return;
    }

    map.setView([location.lat, location.lng], map.getZoom() < 15 ? 15 : map.getZoom(), {
      animate: true,
    });
  }, [location, map]);

  return null;
}

function FullscreenMapController({ isFullscreen }: { isFullscreen: boolean }) {
  const map = useMap();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      window.clearTimeout(timer);
    };
  }, [isFullscreen, map]);

  return null;
}

export function ClientMap({
  markers,
  height = "h-[420px]",
  activeId,
  onSelect,
  onMapClick,
  caption = "OpenStreetMap",
  tracking = false,
  showLiveLocation = false,
  showStartDriving = false,
  onStartDriving,
}: MapViewProps) {
  const locationEnabled = tracking || showLiveLocation;
  const { location: liveLocation, error: locationError } = useLiveLocation(locationEnabled);

  const [routeInfo, setRouteInfo] = useState<{
    instruction: string;
    distanceMeters: number;
    totalDistanceMeters: number;
    totalTimeSeconds: number;
  } | null>(null);
  const [isOffRoute, setIsOffRoute] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapWrapperRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await mapWrapperRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (error) {
      console.error("Fullscreen error:", error);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const animalMarker = markers.find((marker) => marker.kind === "request");

  const distanceKm =
    liveLocation && animalMarker ? calculateDistanceKm(liveLocation, animalMarker.coords) : null;

  const center = useMemo<[number, number]>(() => {
    const first = markers[0];

    if (first?.coords) {
      return [first.coords.lat, first.coords.lng];
    }

    return DEFAULT_CENTER;
  }, [markers]);

  return (
    <div
      ref={mapWrapperRef}
      className={`relative isolate z-0 overflow-hidden rounded-xl ${
        isFullscreen ? "h-screen w-screen rounded-none" : height
      }`}
    >
      {showStartDriving ? (
        <div className="absolute bottom-4 left-1/2 z-[2000] -translate-x-1/2">
          <button
            type="button"
            onClick={onStartDriving}
            className="pointer-events-auto flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-xl transition hover:opacity-90 active:scale-95"
          >
            <span className="text-base">🚗</span>
            Start Driving
          </button>
        </div>
      ) : null}
      <style>{routingContainerStyle}</style>
      {locationEnabled && (routeInfo || isOffRoute) ? (
        <div className="pointer-events-none absolute left-1/2 top-10 md:top-3 z-[1000] w-[min(92%,420px)] -translate-x-1/2">
          <div className="rounded-xl border border-border bg-card/95 px-4 py-3 shadow-lg backdrop-blur">
            {isOffRoute ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-xl">
                  ↻
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">Off route</p>

                  <p className="mt-1 text-sm text-muted-foreground">Recalculating route...</p>
                </div>
              </div>
            ) : routeInfo ? (
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xl">
                  {formatNavigationInstruction(routeInfo.instruction).icon}
                </div>

                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {formatNavigationInstruction(routeInfo.instruction).text}
                  </p>

                  <p className="mt-1 text-sm font-medium text-primary">
                    {routeInfo.distanceMeters < 1000
                      ? `${Math.round(routeInfo.distanceMeters)} m`
                      : `${(routeInfo.distanceMeters / 1000).toFixed(1)} km`}
                  </p>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <button
        type="button"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Exit fullscreen" : "Open map fullscreen"}
        className="absolute right-3 top-3 z-[1000] flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 text-lg shadow-md backdrop-blur transition hover:bg-accent"
      >
        {isFullscreen ? "⛶" : "⛶"}
      </button>
      <MapContainer center={center} zoom={DEFAULT_ZOOM} scrollWheelZoom className="h-full w-full">
        <FullscreenMapController isFullscreen={isFullscreen} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenterController markers={markers} tracking={tracking} />

        <LiveLocationController location={liveLocation} />

        <LiveRoute
          liveLocation={liveLocation}
          destination={animalMarker?.coords}
          onRouteInfo={setRouteInfo}
          onOffRoute={setIsOffRoute}
        />
        {onMapClick ? <MapClickHandler onMapClick={onMapClick} /> : null}

        {markers.map((marker) => {
          if (locationEnabled && (marker.kind === "you" || marker.kind === "rescuer")) {
            return null;
          }

          return (
            <Marker
              key={marker.id}
              position={[marker.coords.lat, marker.coords.lng]}
              icon={markerIcon}
              eventHandlers={{
                click: () => onSelect?.(marker.id),
              }}
            >
              <Popup>
                <div className="min-w-[160px]">
                  <strong>{marker.label}</strong>

                  {marker.sub ? (
                    <div className="mt-1 text-sm text-gray-600">{marker.sub}</div>
                  ) : null}

                  <div className="mt-1 text-xs text-gray-500">
                    {marker.coords.lat.toFixed(6)}, {marker.coords.lng.toFixed(6)}
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        {locationEnabled && liveLocation ? (
          <Marker position={[liveLocation.lat, liveLocation.lng]} icon={rescuerIcon}>
            <Popup>
              <div className="min-w-[160px]">
                <strong>Rescuer — Live Location</strong>

                <div className="mt-1 text-xs text-gray-500">
                  {liveLocation.lat.toFixed(6)}, {liveLocation.lng.toFixed(6)}
                </div>

                <div className="mt-1 text-xs text-gray-500">
                  Accuracy: {Math.round(liveLocation.accuracy)} m
                </div>
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      {/* Map source caption */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
        {caption}
      </div>

      {/* Live GPS status */}
      {locationEnabled ? (
        <div className="pointer-events-none absolute bottom-14 left-3 z-[1000] rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-medium shadow-sm backdrop-blur">
          {locationError ? (
            <span className="text-destructive">{locationError}</span>
          ) : liveLocation ? (
            <div className="space-y-1">
              <div className="text-success">● GPS Active</div>

              {distanceKm !== null ? (
                <div className="font-semibold text-foreground">
                  {distanceKm < 1
                    ? `${Math.round(distanceKm * 1000)} m away`
                    : `${distanceKm.toFixed(2)} km away`}
                </div>
              ) : null}
            </div>
          ) : (
            <span className="text-muted-foreground">Getting location...</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
