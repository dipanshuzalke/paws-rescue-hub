import { createFileRoute, Link } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock, Star, Timer } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MapView, type MapMarker } from "@/components/maps/map-view";
import { useCurrentRescuer } from "@/components/rescuer/use-current-rescuer";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { Emergency } from "@/types";

export const Route = createFileRoute("/rescuer/dashboard")({
  head: () => ({
    meta: [
      { title: "Rescuer Dashboard · ResQ Paws" },
      {
        name: "description",
        content: "Manage your availability and view nearby rescue requests assigned to you.",
      },
      { property: "og:title", content: "Rescuer Dashboard · ResQ Paws" },
      {
        property: "og:description",
        content: "Manage your availability and view nearby rescue requests assigned to you.",
      },
    ],
  }),
  component: RescuerDashboard,
});

const emergencyOrder: Record<Emergency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function RescuerDashboard() {
  const { reports, user, updateAvailability } = useApp();
  const rescuer = useCurrentRescuer();
  const [availability, setAvailability] = useState(rescuer.availability);

  useEffect(() => {
    setAvailability(rescuer.availability);
  }, [rescuer.availability]);

  const incoming = useMemo(
    () =>
      reports
        .filter((r) => r.status === "REPORTED" || r.status === "ASSIGNED")
        .sort(
          (a, b) =>
            emergencyOrder[a.emergency] - emergencyOrder[b.emergency] ||
            a.distanceKm - b.distanceKm,
        )
        .slice(0, 6),
    [reports],
  );

  const active = useMemo(
    () =>
      reports.find(
        (r) =>
          r.rescuerId === user?.id && (r.status === "ACCEPTED" || r.status === "IN_PROGRESS"),
      ),
    [reports, user],
  );

  const markers: MapMarker[] = useMemo(
    () => [
      { id: "you", label: "You", coords: rescuer.coords, kind: "you" },
      ...incoming.map((r) => ({
        id: r.id,
        label: r.title,
        sub: `${r.distanceKm} km · ${r.area}`,
        coords: r.coords,
        emergency: r.emergency,
        kind: "request" as const,
      })),
    ],
    [incoming, rescuer.coords],
  );

  const cycleAvailability = async (value: string) => {
    const next = value as typeof availability;
    try {
      const updated = await updateAvailability(next);
      setAvailability(updated?.availability ?? next);
      toast.success(`You are now marked as ${value}`);
    } catch {
      toast.error("Could not update your availability. Please try again.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${rescuer.name.split(" ")[0]}`}
        description="Here's what's happening near you right now."
        actions={
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted-foreground">Availability</span>
            <Select value={availability} onValueChange={cycleAvailability}>
              <SelectTrigger className="w-[150px] bg-card" aria-label="Set availability">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Available">Available</SelectItem>
                <SelectItem value="Busy">Busy</SelectItem>
                <SelectItem value="Offline">Offline</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Assigned Today" value={incoming.length} icon={Activity} tone="primary" />
        <StatCard label="Active Cases" value={rescuer.activeCases} icon={Timer} tone="warning" />
        <StatCard
          label="Completed"
          value={rescuer.completedCases}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard
          label="Avg Response"
          value={`${rescuer.avgResponseMins}m`}
          icon={Clock}
          tone="info"
          animate={false}
        />
        <StatCard label="Rating" value={rescuer.rating} icon={Star} tone="neutral" animate={false} />
      </div>

      {active ? (
        <section className="card-surface border-primary/30 bg-primary-soft/30 p-5">
          <SectionHeading
            title="Current active rescue"
            description="You're currently working on this case."
          />
          <Link
            to="/rescuer/requests/$id"
            params={{ id: active.id }}
            className="flex flex-col gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold text-foreground">{active.title}</p>
              <p className="truncate text-sm text-muted-foreground">
                {active.area}, {active.city} · {active.distanceKm} km away
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge level={active.emergency} />
              <StatusBadge status={active.status} />
            </div>
          </Link>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <section className="lg:col-span-3">
          <SectionHeading
            title="Nearby incoming requests"
            description="Sorted by emergency level, then distance."
            actions={
              <Link
                to="/rescuer/requests"
                className="text-sm font-semibold text-primary hover:underline"
              >
                View all
              </Link>
            }
          />
          {incoming.length === 0 ? (
            <EmptyState title="No nearby requests" description="You're all caught up for now." />
          ) : (
            <ul className="space-y-3">
              {incoming.map((r) => (
                <li key={r.id}>
                  <Link
                    to="/rescuer/requests/$id"
                    params={{ id: r.id }}
                    className="card-surface flex items-center gap-3 p-3 transition-shadow hover:shadow-[var(--shadow-pop)]"
                  >
                    <img
                      src={r.images[0]}
                      alt=""
                      className="h-14 w-14 shrink-0 rounded-lg object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {r.area} · {r.distanceKm} km · {timeAgo(r.createdAt)}
                      </p>
                    </div>
                    <PriorityBadge level={r.emergency} className="shrink-0" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="lg:col-span-2">
          <SectionHeading title="Nearby map" description="Your position and open requests." />
          <MapView markers={markers} activeId={active?.id} height="h-[380px]" />
        </section>
      </div>
    </div>
  );
}
