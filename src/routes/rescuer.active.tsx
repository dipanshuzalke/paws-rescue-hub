import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";

import { elapsedLabel } from "@/components/rescuer/use-current-rescuer";
import { calculateDistanceKm, useLiveLocation } from "@/hooks/useLiveLocation";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/rescuer/active")({
  head: () => ({
    meta: [
      { title: "Active Rescues · ResQ Paws" },
      {
        name: "description",
        content: "Track and progress the rescues currently assigned to you.",
      },
      { property: "og:title", content: "Active Rescues · ResQ Paws" },
      {
        property: "og:description",
        content: "Track and progress the rescues currently assigned to you.",
      },
    ],
  }),
  component: RescuerActive,
});

function RescuerActive() {
  const { reports, user } = useApp();
  const [, setTick] = useState(0);

  const { location: rescuerLocation, error: locationError } = useLiveLocation(
    user?.role === "rescuer",
  );

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => window.clearInterval(id);
  }, []);

  const active = useMemo(
    () =>
      reports
        .filter(
          (r) =>
            r.rescuerId === user?.id && (r.status === "ACCEPTED" || r.status === "IN_PROGRESS"),
        )
        .map((r) => ({
          ...r,
          liveDistanceKm: rescuerLocation ? calculateDistanceKm(rescuerLocation, r.coords) : null,
        })),
    [reports, user, rescuerLocation],
  );

  return (
    <div className="space-y-6">
      <PageHeader title="Active Rescues" description="Cases you're currently working on." />

      {active.length === 0 ? (
        <EmptyState title="No active rescues" description="Accept a request to see it here." />
      ) : (
        <ul className="space-y-4">
          {active.map((r) => (
            <li key={r.id} className="card-surface p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Link
                  to="/rescuer/requests/$id"
                  params={{ id: r.id }}
                  className="min-w-0 flex-1 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <p className="truncate font-semibold text-foreground">{r.title}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {r.area}, {r.city} ·{" "}
                    {r.liveDistanceKm !== null
                      ? `${r.liveDistanceKm.toFixed(1)} km`
                      : "Getting location..."}{" "}
                    · Elapsed {elapsedLabel(r.updatedAt)}
                  </p>
                </Link>
                <div className="flex flex-wrap items-center gap-2">
                  <PriorityBadge level={r.emergency} />
                  <StatusBadge status={r.status} />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/rescuer/requests/$id" params={{ id: r.id }}>
                    View details
                  </Link>
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
