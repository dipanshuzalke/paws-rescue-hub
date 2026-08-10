import { Link } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCircle2, Clock, MapPin, PawPrint, PlusCircle, Timer } from "lucide-react";

import { CaseCard } from "@/components/rescue/case-card";
import { EmptyState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { Button } from "@/components/ui/button";
import { MapView } from "@/components/maps/map-view";
import { useApp } from "@/store/app-store";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/citizen/dashboard")({
  head: () => ({
    meta: [
      { title: "Citizen Dashboard · ResQ Paws" },
      { name: "description", content: "Overview of your rescue reports, active rescues and nearby cases." },
      { property: "og:title", content: "Citizen Dashboard · ResQ Paws" },
      { property: "og:description", content: "Overview of your rescue reports, active rescues and nearby cases." },
    ],
  }),
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const { user, reports, notifications } = useApp();

  const myReports = reports.filter((r) => r.reporterId === user?.id);
  const active = myReports.filter((r) =>
    ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(r.status),
  );
  const completed = myReports.filter((r) => r.status === "RESCUED" || r.status === "CLOSED");
  const withDuration = completed.filter((r) => r.durationMins);
  const avgResponse = withDuration.length
    ? Math.round(withDuration.reduce((s, r) => s + (r.durationMins ?? 0), 0) / withDuration.length)
    : 0;

  const nearby = reports
    .filter((r) => ["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(r.status))
    .slice(0, 8);

  const myNotifications = notifications
    .filter((n) => n.role === "citizen" || n.role === "all")
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">
          Welcome back{user ? `, ${user.name.split(" ")[0]}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s what&apos;s happening with your rescue reports today.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total reports" value={myReports.length} icon={PawPrint} tone="primary" />
        <StatCard label="Active rescues" value={active.length} icon={Timer} tone="warning" />
        <StatCard label="Completed" value={completed.length} icon={CheckCircle2} tone="success" />
        <StatCard
          label="Avg. response"
          value={avgResponse ? `${avgResponse}m` : "—"}
          icon={Clock}
          tone="info"
        />
      </div>

      <div className="card-surface flex flex-col items-start gap-4 border-primary/20 bg-primary-soft/40 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-bold text-foreground">Spotted an animal in need?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Report it in under a minute — photos, location and emergency level help rescuers respond faster.
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link to="/citizen/report">
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            Report an Animal
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold text-foreground">Your recent reports</h2>
            <Link to="/citizen/reports" className="text-sm font-semibold text-primary hover:underline">
              View all
            </Link>
          </div>
          {myReports.length === 0 ? (
            <EmptyState
              title="No reports yet"
              description="Your submitted rescue reports will show up here."
              action={
                <Button asChild>
                  <Link to="/citizen/report">Report an animal</Link>
                </Button>
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myReports.slice(0, 4).map((r) => (
                <CaseCard key={r.id} report={r} to="/citizen/reports/$id" params={{ id: r.id }} />
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-display text-lg font-bold text-foreground">Recent notifications</h2>
          <div className="card-surface divide-y divide-border p-0">
            {myNotifications.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">No notifications yet.</p>
            ) : (
              myNotifications.map((n) => (
                <div key={n.id} className="flex items-start gap-3 p-4">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                    <Bell className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                    <p className="line-clamp-2 text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <Link
            to="/citizen/notifications"
            className="block text-sm font-semibold text-primary hover:underline"
          >
            View all notifications
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <h2 className="font-display text-lg font-bold text-foreground">Active cases near you</h2>
        </div>
        <MapView
          height="h-[320px]"
          markers={nearby.map((r) => ({
            id: r.id,
            label: r.title,
            sub: `${r.area}, ${r.city}`,
            coords: r.coords,
            emergency: r.emergency,
          }))}
        />
      </div>
    </div>
  );
}
