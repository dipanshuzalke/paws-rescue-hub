import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { MapView, type MapMarker } from "@/components/maps/map-view";
import { useCurrentRescuer } from "@/components/rescuer/use-current-rescuer";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/rescuer/map")({
  head: () => ({
    meta: [
      { title: "Rescue Map · ResQ Paws" },
      {
        name: "description",
        content: "See all open rescue requests plotted on the map.",
      },
      { property: "og:title", content: "Rescue Map · ResQ Paws" },
      { property: "og:description", content: "See all open rescue requests plotted on the map." },
    ],
  }),
  component: RescuerMap,
});

function RescuerMap() {
  const { reports } = useApp();
  const rescuer = useCurrentRescuer();
  const [activeId, setActiveId] = useState<string | undefined>();

  const open = useMemo(
    () => reports.filter((r) => r.status === "REPORTED" || r.status === "ASSIGNED"),
    [reports],
  );

  const markers: MapMarker[] = useMemo(
    () => [
      { id: "you", label: "You", coords: rescuer.coords, kind: "you" },
      ...open.map((r) => ({
        id: r.id,
        label: r.title,
        sub: `${r.distanceKm} km · ${r.area}`,
        coords: r.coords,
        emergency: r.emergency,
        kind: "request" as const,
      })),
    ],
    [open, rescuer.coords],
  );

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col gap-4">
      <PageHeader title="Rescue Map" description="All open requests near you." />
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[340px_1fr]">
        <aside className="flex min-h-0 flex-col overflow-y-auto">
          {open.length === 0 ? (
            <EmptyState title="No open requests" />
          ) : (
            <ul className="space-y-2">
              {open.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => setActiveId(r.id)}
                    className={cn(
                      "w-full rounded-lg border p-3 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      activeId === r.id
                        ? "border-primary bg-primary-soft"
                        : "border-border bg-card hover:bg-muted",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 truncate text-sm font-semibold text-foreground">
                        {r.title}
                      </p>
                      <PriorityBadge level={r.emergency} />
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      {r.area} · {r.distanceKm} km
                    </p>
                    <Link
                      to="/rescuer/requests/$id"
                      params={{ id: r.id }}
                      className="mt-2 inline-block text-xs font-semibold text-primary hover:underline"
                    >
                      View details
                    </Link>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>
        <div className="min-h-[420px]">
          <MapView
            markers={markers}
            activeId={activeId}
            onSelect={setActiveId}
            height="h-full"
          />
        </div>
      </div>
    </div>
  );
}
