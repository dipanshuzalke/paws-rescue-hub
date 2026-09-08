import { useEffect, useMemo } from "react";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    useMap,
    useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import type { GeoPoint } from "@/types";
import type { MapViewProps, MapMarker } from "./map-view";

const DEFAULT_CENTER: [number, number] = [21.1458, 79.0882];
const DEFAULT_ZOOM = 14;

const markerIcon = new L.Icon({
    iconUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});

function MapCenterController({
    markers,
}: {
    markers: MapMarker[];
}) {
    const map = useMap();

    useEffect(() => {
        const first = markers[0];

        if (!first?.coords) {
            return;
        }

        map.setView(
            [first.coords.lat, first.coords.lng],
            16,
            {
                animate: false,
            },
        );
    }, [markers, map]);

    return null;
}

function MapClickHandler({
    onMapClick,
}: {
    onMapClick?: (coords: GeoPoint) => void;
}) {
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

export function ClientMap({
    markers,
    height = "h-[420px]",
    activeId,
    onSelect,
    onMapClick,
    caption = "OpenStreetMap",
}: MapViewProps) {
    const center = useMemo<[number, number]>(() => {
        const first = markers[0];

        if (first?.coords) {
            return [first.coords.lat, first.coords.lng];
        }

        return DEFAULT_CENTER;
    }, [markers]);

    return (
        <div
            className={`relative isolate z-0 overflow-hidden rounded-xl ${height}`}
        >
            <MapContainer
                center={center}
                zoom={DEFAULT_ZOOM}
                scrollWheelZoom
                className="h-full w-full"
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <MapCenterController markers={markers} />

                {onMapClick ? (
                    <MapClickHandler onMapClick={onMapClick} />
                ) : null}

                {markers.map((marker) => (
                    <Marker
                        key={marker.id}
                        position={[
                            marker.coords.lat,
                            marker.coords.lng,
                        ]}
                        icon={markerIcon}
                        eventHandlers={{
                            click: () => onSelect?.(marker.id),
                        }}
                    >
                        <Popup>
                            <div className="min-w-[160px]">
                                <strong>{marker.label}</strong>

                                {marker.sub ? (
                                    <div className="mt-1 text-sm text-gray-600">
                                        {marker.sub}
                                    </div>
                                ) : null}

                                <div className="mt-1 text-xs text-gray-500">
                                    {marker.coords.lat.toFixed(6)},{" "}
                                    {marker.coords.lng.toFixed(6)}
                                </div>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>

            <div className="pointer-events-none absolute bottom-3 left-3 z-[1000] rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur">
                {caption}
            </div>
        </div>
    );
}