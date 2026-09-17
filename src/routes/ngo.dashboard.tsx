import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Clock, Inbox, ShieldCheck, Timer, Truck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, XAxis } from "recharts";

import { AssignDialog } from "@/components/ngo/assign-dialog";
import { MapView } from "@/components/maps/map-view";
import { AvailabilityBadge, PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { PresenceBadge } from "@/components/shared/presence-badge";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { EmptyState, StatSkeletonRow } from "@/components/shared/states";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { seriesForRange } from "@/data/mockAnalytics";
import { mockRescuers } from "@/data/mockUsers";
import { useAsync } from "@/hooks/use-async";
import { initials, timeAgo } from "@/lib/format";
import { analyticsService } from "@/services/analyticsService";
import { evidenceService } from "@/services/evidenceService";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";
import type { RescueReport } from "@/types";
import { useAvailableRescuersLocation } from "@/hooks/useAvailableResquer";

export const Route = createFileRoute("/ngo/dashboard")({
  head: () => ({
    meta: [
      { title: "NGO Dashboard · ResQ Paws" },
      { name: "description", content: "Operations overview for your rescue organization." },
      { property: "og:title", content: "NGO Dashboard · ResQ Paws" },
      {
        property: "og:description",
        content: "Track open requests, assignments and rescue performance in real time.",
      },
    ],
  }),
  component: NgoDashboard,
});

const emergencyColors: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH: "var(--color-warning)",
  MEDIUM: "var(--color-caution)",
  LOW: "var(--color-info)",
};

function NgoDashboard() {
  const { reports, apiMode } = useApp();
  const [assignTarget, setAssignTarget] = useState<RescueReport | null>(null);

  const {
    data: rescuersData,
    loading: rescuersLoading,
    retry: retryRescuers,
  } = useAsync(
    () =>
      apiMode
        ? ngoService.getRescuers({ limit: 50 }).then((r) => r.items)
        : Promise.resolve(mockRescuers),
    [apiMode],
  );
  const rescuers = rescuersData ?? [];

  const { data: overview } = useAsync(
    () => (apiMode ? analyticsService.getOverview() : Promise.resolve(null)),
    [apiMode],
  );

  useEffect(() => {
    if (!apiMode) return;
    const interval = window.setInterval(retryRescuers, 30_000);
    return () => window.clearInterval(interval);
  }, [apiMode, retryRescuers]);

  const { data: monthlyData, loading: chartLoading } = useAsync(
    () =>
      apiMode
        ? analyticsService
            .getMonthly()
            .then((pts) =>
              pts.map((p) => ({ period: p.month, reported: p.reports, rescued: p.rescued })),
            )
        : Promise.resolve(seriesForRange("6m")),
    [apiMode],
  );

  const { data: pendingVerification, loading: pendingLoading } = useAsync(
    () =>
      apiMode
        ? evidenceService.getPending({ limit: 100 }).then((r) => r.items)
        : Promise.resolve(
            reports.filter(
              (r) => r.evidence?.status === "PENDING" || r.evidence?.status === "REJECTED",
            ),
          ),
    [apiMode, reports],
  );

  const pendingCount = pendingVerification?.length ?? 0;

  const open = reports.filter((r) => r.status === "REPORTED");
  const assigned = reports.filter((r) => r.status === "ASSIGNED");
  const inProgress = reports.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS");
  const now = new Date();
  const rescuedThisMonth = reports.filter((r) =>
    r.status === "RESCUED" || r.status === "CLOSED"
      ? new Date(r.updatedAt).getMonth() === now.getMonth() &&
        new Date(r.updatedAt).getFullYear() === now.getFullYear()
      : false,
  );
  const rescuerAverage = rescuers.length
    ? Math.round(rescuers.reduce((sum, r) => sum + r.avgResponseMins, 0) / rescuers.length)
    : 0;
  const avgResponse = overview?.avgResponseMins ?? rescuerAverage;

  const urgentQueue = useMemo(
    () =>
      open
        .slice()
        .sort((a, b) => {
          const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 } as const;
          return order[a.emergency] - order[b.emergency];
        })
        .slice(0, 6),
    [open],
  );

  const activeMapMarkers = [...assigned, ...inProgress].map((r) => ({
    id: r.id,
    label: `#${r.id} · ${r.title}`,
    sub: `${r.area}, ${r.city}`,
    coords: r.coords,
    emergency: r.emergency,
  }));

  const chartData = monthlyData ?? [];
  const emergencyCounts = (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((e) => ({
    name: e,
    value: reports.filter((r) => r.emergency === e).length,
  }));

  const availableRescuersLive = useAvailableRescuersLocation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations overview"
        description="Live snapshot of rescue requests, assignments and team availability."
        actions={
          <Button asChild>
            <Link to="/ngo/requests">View all requests</Link>
          </Button>
        }
      />

      {rescuersLoading ? (
        <StatSkeletonRow count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
          <StatCard label="Open requests" value={open.length} icon={Inbox} tone="info" />
          <StatCard label="Assigned" value={assigned.length} icon={CheckCircle2} tone="primary" />
          <StatCard label="In progress" value={inProgress.length} icon={Truck} tone="warning" />
          <StatCard
            label="Pending verification"
            value={pendingLoading ? "…" : pendingCount}
            icon={ShieldCheck}
            tone={pendingCount > 0 ? "warning" : "neutral"}
          />
          <StatCard
            label="Rescued this month"
            value={rescuedThisMonth.length}
            icon={AlertTriangle}
            tone="success"
          />
          <StatCard
            label="Avg. response time"
            value={`${avgResponse}m`}
            icon={Timer}
            tone="neutral"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading
            title="Urgent unassigned queue"
            description="Highest-priority reports waiting for a rescuer."
          />
          {urgentQueue.length ? (
            <ul className="space-y-2">
              {urgentQueue.map((r) => (
                <li
                  key={r.id}
                  className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <PriorityBadge level={r.emergency} />
                      <Link
                        to="/ngo/requests/$id"
                        params={{ id: r.id }}
                        className="truncate text-sm font-semibold text-foreground hover:underline"
                      >
                        #{r.id} · {r.title}
                      </Link>
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {timeAgo(r.createdAt)} · {r.area}, {r.city}
                    </p>
                  </div>
                  <Button size="sm" onClick={() => setAssignTarget(r)} className="shrink-0">
                    Assign
                  </Button>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState title="No urgent requests" description="All critical cases are covered." />
          )}
        </div>

        <div className="card-surface p-5">
          <SectionHeading
            title="Evidence verification"
            description="Rescue evidence awaiting your review."
          />
          {pendingLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : pendingCount > 0 ? (
            <div className="space-y-3">
              <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">
                case{pendingCount !== 1 ? "s" : ""} need verification
              </p>
              <Button asChild size="sm" className="w-full">
                <Link to="/ngo/pending-verification">Review evidence</Link>
              </Button>
            </div>
          ) : (
            <EmptyState
              title="All caught up"
              description="No rescue evidence is waiting for review."
              icon={ShieldCheck}
              className="py-8"
            />
          )}
        </div>
      </div>

      <div className="card-surface p-5">
        <SectionHeading title="Team availability" description="Rescuers in your network." />
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rescuers.slice(0, 6).map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback>{initials(r.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{r.name}</p>
                <p className="truncate text-xs text-muted-foreground">{r.activeCases} active</p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <AvailabilityBadge value={r.availability} />
                <PresenceBadge online={r.isOnline ?? false} />
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading
            title="Cases over time"
            description="Reported vs. rescued (last 6 months)."
          />
          {chartLoading ? null : (
            <ChartContainer
              config={{
                reported: { label: "Reported", color: "var(--color-chart-1)" },
                rescued: { label: "Rescued", color: "var(--color-chart-2)" },
              }}
              className="h-[260px] w-full"
            >
              <AreaChart data={chartData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="period" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="reported"
                  stroke="var(--color-reported)"
                  fill="var(--color-reported)"
                  fillOpacity={0.15}
                />
                <Area
                  type="monotone"
                  dataKey="rescued"
                  stroke="var(--color-rescued)"
                  fill="var(--color-rescued)"
                  fillOpacity={0.25}
                />
              </AreaChart>
            </ChartContainer>
          )}
        </div>
        <div className="card-surface p-5">
          <SectionHeading
            title="Emergency distribution"
            description="All-time reports by priority."
          />
          <ChartContainer config={{}} className="h-[260px] w-full">
            <PieChart>
              <ChartTooltip content={<ChartTooltipContent />} />
              <Pie
                data={emergencyCounts}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
              >
                {emergencyCounts.map((entry) => (
                  <Cell key={entry.name} fill={emergencyColors[entry.name]} />
                ))}
              </Pie>
            </PieChart>
          </ChartContainer>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Active cases map"
          description="Assigned and in-progress rescues right now."
        />
        <MapView
          markers={activeMapMarkers}
          availableRescuerLocations={availableRescuersLive}
          height="h-[420px]"
          showNavigation={false}
        />
      </div>

      <AssignDialog
        report={assignTarget}
        open={!!assignTarget}
        onOpenChange={(v) => !v && setAssignTarget(null)}
      />
    </div>
  );
}
