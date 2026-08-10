import { Crosshair, Layers, MapPin, Minus, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Emergency, GeoPoint } from "@/types";

export interface MapMarker {
  id: string;
  label: string;
  sub?: string;
  coords: GeoPoint;
  emergency?: Emergency;
  kind?: "request" | "rescuer" | "you";
}

const BOUNDS = { minLat: 21.07, maxLat: 21.17, minLng: 78.99, maxLng: 79.095 };

function project(coords: GeoPoint) {
  const x = ((coords.lng - BOUNDS.minLng) / (BOUNDS.maxLng - BOUNDS.minLng)) * 100;
  const y = 100 - ((coords.lat - BOUNDS.minLat) / (BOUNDS.maxLat - BOUNDS.minLat)) * 100;
  return { x: Math.min(94, Math.max(6, x)), y: Math.min(92, Math.max(8, y)) };
}

const pinTone: Record<Emergency, string> = {
  CRITICAL: "bg-critical text-critical-foreground ring-critical/25",
  HIGH: "bg-warning text-warning-foreground ring-warning/25",
  MEDIUM: "bg-caution text-caution-foreground ring-caution/25",
  LOW: "bg-info text-info-foreground ring-info/25",
};

/**
 * Phase 1 map surface. Markers are projected from mock coordinates onto a
 * schematic street canvas. In Phase 3 this component is swapped for a Leaflet
 * / OpenStreetMap instance while keeping the same `markers` contract.
 */
export function MapView({
  markers,
  height = "h-[420px]",
  activeId,
  onSelect,
  caption = "Nagpur · Demo map surface (mock coordinates)",
}: {
  markers: MapMarker[];
  height?: string | undefined;
  activeId?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  caption?: string | undefined;
}) {
  return (
    <div className={cn("card-surface relative overflow-hidden", height)}>
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[linear-gradient(0deg,transparent_23px,color-mix(in_oklab,var(--color-border)_70%,transparent)_24px),linear-gradient(90deg,transparent_23px,color-mix(in_oklab,var(--color-border)_70%,transparent)_24px)] bg-[length:24px_24px] opacity-70"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-[radial-gradient(circle_at_30%_25%,color-mix(in_oklab,var(--color-success)_12%,transparent),transparent_45%),radial-gradient(circle_at_75%_70%,color-mix(in_oklab,var(--color-info)_14%,transparent),transparent_50%)]"
      />
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full text-border"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <path d="M0 62 L40 55 L62 70 L100 58" stroke="currentColor" strokeWidth="1.6" fill="none" />
        <path d="M18 0 L26 44 L20 100" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M70 0 L64 40 L78 100" stroke="currentColor" strokeWidth="1.2" fill="none" />
        <path d="M0 28 L100 22" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>

      <ul className="absolute inset-0">
        {markers.map((m) => {
          const { x, y } = project(m.coords);
          const active = activeId === m.id;
          const tone =
            m.kind === "rescuer"
              ? "bg-primary text-primary-foreground ring-primary/25"
              : m.kind === "you"
                ? "bg-foreground text-background ring-foreground/20"
                : pinTone[m.emergency ?? "LOW"];
          return (
            <li key={m.id} className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
              <button
                type="button"
                onClick={() => onSelect?.(m.id)}
                aria-label={`${m.label}${m.sub ? `, ${m.sub}` : ""}`}
                className={cn(
                  "group -translate-x-1/2 -translate-y-1/2 rounded-full p-1.5 ring-4 transition-transform focus-visible:ring-4 focus-visible:ring-ring focus-visible:outline-none",
                  tone,
                  active ? "scale-125" : "hover:scale-110",
                )}
              >
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                <span className="pointer-events-none absolute top-full left-1/2 z-20 mt-2 hidden -translate-x-1/2 rounded-lg border border-border bg-popover px-2.5 py-1.5 text-left text-xs whitespace-nowrap text-popover-foreground shadow-[var(--shadow-pop)] group-hover:block group-focus-visible:block">
                  <span className="block font-semibold">{m.label}</span>
                  {m.sub ? <span className="block text-muted-foreground">{m.sub}</span> : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="absolute top-3 right-3 flex flex-col gap-1.5">
        {[Plus, Minus, Crosshair, Layers].map((Icon, i) => (
          <span
            key={i}
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-muted-foreground shadow-sm"
          >
            <Icon className="h-4 w-4" />
          </span>
        ))}
      </div>

      <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-card/95 px-3 py-2 text-[11px] font-medium text-muted-foreground backdrop-blur">
        <span>{caption}</span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-critical" /> Critical
        </span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-warning" /> High
        </span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-caution" /> Medium
        </span>
        <span className="hidden items-center gap-1 sm:inline-flex">
          <span className="h-2 w-2 rounded-full bg-info" /> Low
        </span>
      </div>
    </div>
  );
}