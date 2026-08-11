import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MapPin, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { MapView, type MapMarker } from "@/components/maps/map-view";
import { timeAgo } from "@/lib/format";
import { getActiveRescues } from "@/services";

export const Route = createFileRoute("/admin/active-rescues")({
  head: () => ({
    meta: [
      { title: "Active Rescues · ResQ Paws Admin" },
      {
        name: "description",
        content: "Live monitoring of accepted and in-progress rescue cases across ResQ Paws.",
      },
      { property: "og:title", content: "Active Rescues · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Track rescuers currently on active cases in real time.",
      },
    ],
  }),
  component: AdminActiveRescues,
});

function AdminActiveRescues() {
  const { data, loading } = useAsync(getActiveRescues, []);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);

  const list = data ?? [];

  const markers: MapMarker[] = useMemo(
    () =>
      list.map((r) => ({
        id: r.id,
        label: `#${r.id} · ${r.title}`,
        sub: `${r.rescuerName ?? "Unassigned"} · ${r.area}`,
        coords: r.coords,
        emergency: r.emergency,
        kind: "request",
      })),
    [list],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Rescues"
        description="Live view of every accepted or in-progress rescue case right now."
      />

      <div className="card-surface p-5">
        <SectionHeading
          title="Live map"
          description={`${list.length} rescue${list.length === 1 ? "" : "s"} currently in motion`}
        />
        <MapView markers={markers} activeId={activeId} onSelect={setActiveId} height="h-[380px]" />
      </div>

      <div className="card-surface p-5">
        <SectionHeading title="In-progress cases" />
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState title="No active rescues" description="There are no accepted or in-progress cases right now." icon={Truck} />
        ) : (
          <ul className="divide-y divide-border">
            {list.map((r) => (
              <li
                key={r.id}
                className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                onMouseEnter={() => setActiveId(r.id)}
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">#{r.id}</span>
                    <PriorityBadge level={r.emergency} />
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{r.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> {r.area}, {r.city}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" /> {timeAgo(r.updatedAt)}
                    </span>
                    <span>{r.rescuerName ? `Rescuer: ${r.rescuerName}` : "Unassigned rescuer"}</span>
                    {r.ngoName ? <span>{r.ngoName}</span> : null}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/admin/reports/$id" params={{ id: r.id }}>
                    View case <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
