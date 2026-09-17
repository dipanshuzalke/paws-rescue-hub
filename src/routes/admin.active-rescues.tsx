import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, Clock, MapPin, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { MapView } from "@/components/maps/map-view";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAvailableRescuersLocation } from "@/hooks/useAvailableResquer";
import { timeAgo } from "@/lib/format";
import { getActiveRescues } from "@/services";
import { adminService } from "@/services/adminService";
import { useAsync } from "@/hooks/use-async";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/admin/active-rescues")({
  head: () => ({
    meta: [
      { title: "Active Rescues · ResQ Paws Admin" },
      {
        name: "description",
        content:
          "Live monitoring of accepted and in-progress rescue cases across ResQ Paws.",
      },
      {
        property: "og:title",
        content: "Active Rescues · ResQ Paws Admin",
      },
      {
        property: "og:description",
        content:
          "Track rescuers currently on active cases in real time.",
      },
    ],
  }),
  component: AdminActiveRescues,
});

function AdminActiveRescues() {
  const { apiMode } = useApp();

  // SAME AS NGO
  const availableRescuerLocations =
    useAvailableRescuersLocation();

  const { data, loading } = useAsync(
    () =>
      apiMode
        ? adminService
            .getReports({ limit: 500 })
            .then((r) =>
              r.items.filter(
                (x) =>
                  x.status === "ASSIGNED" ||
                  x.status === "ACCEPTED" ||
                  x.status === "IN_PROGRESS",
              ),
            )
        : getActiveRescues(),
    [apiMode],
  );

  const [activeId, setActiveId] =
    useState<string | undefined>(undefined);

  const list = data ?? [];

  /*
   * Rescue case markers
   * Same structure as NGO.
   */
  const markers = useMemo(
    () =>
      list.map((r) => ({
        id: r.id,
        label: `#${r.id} · ${r.title}`,
        sub: `${r.rescuerName ?? "Unassigned"} · ${r.area}`,
        coords: r.coords,
        emergency: r.emergency,
        kind: "request" as const,
      })),
    [list],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active Rescues"
        description={`${list.length} rescue${
          list.length === 1 ? "" : "s"
        } currently active.`}
      />

      {/* ================= LIVE MAP ================= */}
      <div className="card-surface p-5">
        <SectionHeading
          title="Live map"
          description="Locations of all active rescue cases and available rescuers."
        />

        <MapView
          markers={markers}
          availableRescuerLocations={availableRescuerLocations}
          activeId={activeId}
          onSelect={setActiveId}
          height="h-[420px]"
          showNavigation={false}
        />
      </div>

      {/* ================= ACTIVE CASES ================= */}
      <div className="card-surface p-5">
        <SectionHeading title="Active rescue cases" />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="h-20 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No active rescues"
            description="Assigned, accepted and in-progress cases will appear here."
            icon={Truck}
          />
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
                    <span className="text-sm font-semibold text-foreground">
                      #{r.id}
                    </span>

                    <PriorityBadge level={r.emergency} />

                    <StatusBadge status={r.status} />
                  </div>

                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    {r.title}
                  </p>

                  <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <MapPin
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {r.area}, {r.city}
                    </span>

                    <span className="inline-flex items-center gap-1">
                      <Clock
                        className="h-3.5 w-3.5"
                        aria-hidden="true"
                      />
                      {timeAgo(r.updatedAt)}
                    </span>

                    <span>
                      {r.rescuerName
                        ? `Rescuer: ${r.rescuerName}`
                        : "Unassigned rescuer"}
                    </span>

                    {r.ngoName ? (
                      <span>{r.ngoName}</span>
                    ) : null}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <Link
                    to="/admin/reports/$id"
                    params={{ id: r.id }}
                  >
                    View case
                    <ArrowUpRight
                      className="h-4 w-4"
                      aria-hidden="true"
                    />
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