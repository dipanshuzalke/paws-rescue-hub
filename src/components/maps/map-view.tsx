import { useEffect, useState } from "react";

import type { Emergency, GeoPoint } from "@/types";
import type { LiveLocation } from "@/hooks/useLiveLocation";
import { AvailableRescuerLocation } from "@/hooks/useAvailableResquer";

export interface MapMarker {
  id: string;
  label: string;
  sub?: string;
  coords: GeoPoint;
  emergency?: Emergency;
  kind?: "request" | "rescuer" | "you";
}

export interface MapViewProps {
  markers: MapMarker[];

  height?: string;

  activeId?: string | undefined;

  onSelect?: ((id: string) => void) | undefined;

  onMapClick?: (coords: GeoPoint) => void;

  caption?: string;

  tracking?: boolean;

  showLiveLocation?: boolean;

  showStartDriving?: boolean;

  onStartDriving?: () => void;

  /**
   * =========================================================
   * LIVE LOCATION
   * =========================================================
   */

  // Rescuer's own browser GPS
  liveLocation?: LiveLocation | null;

  locationError?: string | null;

  // Rescuer GPS received through Socket.IO
  // Used by Citizen / NGO / Admin
  remoteRescuerLocation?: LiveLocation | null;

  /**
   * =========================================================
   * NAVIGATION
   * =========================================================
   *
   * true  -> show turn-by-turn navigation
   * false -> hide navigation instructions
   *
   * Recommended:
   * Rescuer       -> true
   * Citizen       -> false
   * NGO           -> false
   * Admin         -> false
   */
  showNavigation?: boolean;

  availableRescuerLocations?: AvailableRescuerLocation[];

  rescuerName?: string;
}

export function MapView(props: MapViewProps) {
  const [ClientMap, setClientMap] = useState<React.ComponentType<MapViewProps> | null>(null);

  useEffect(() => {
    let mounted = true;

    import("./client-map").then(({ ClientMap: LoadedMap }) => {
      if (mounted) {
        setClientMap(() => LoadedMap);
      }
    });

    return () => {
      mounted = false;
    };
  }, []);

  if (!ClientMap) {
    return (
      <div
        className={`flex ${
          props.height ?? "h-[420px]"
        } items-center justify-center rounded-xl border border-border bg-muted`}
      >
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    );
  }

  return <ClientMap {...props} />;
}
