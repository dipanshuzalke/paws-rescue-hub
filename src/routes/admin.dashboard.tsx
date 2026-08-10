import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  Building2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Timer,
  Truck,
  Users,
} from "lucide-react";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ActivityList } from "@/components/admin/activity-list";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatSkeletonRow, TableSkeleton } from "@/components/shared/states";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { seriesForRange } from "@/data/mockAnalytics";
import { getActivity, getNGOs, getReports, getUsers } from "@/services";

export const Route = createFileRoute("/admin/dashboard")({
  head: () => ({
    meta: [
      { title: "Platform Overview · ResQ Paws Admin" },
      {
        name: "description",
        content: "Platform-wide KPIs, trends and system health for ResQ Paws administrators.",
      },
      { property: "og:title", content: "Platform Overview · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Monitor users, NGOs, rescues and system activity across ResQ Paws.",
      },
    ],
  }),
  component: AdminDashboard,
});

const roleColors: Record<string, string> = {
  citizen: "var(--color-chart-1)",
  rescuer: "var(--color-chart-2)",
  ngo: "var(--color-chart-3)",
  admin: "var(--color-chart-4)",
};

function AdminDashboard() {
  const usersState = useAsync(getUsers, []);
  const ngosState = useAsync(getNGOs, []);
  const reportsState = useAsync(getReports, []);
  const activityState = useAsync(getActivity, []);

  const loading = usersState.loading || ngosState.loading || reportsState.loading;

  const stats = useMemo(() => {
    const users = usersState.data ?? [];
    const ngos = ngosState.data ?? [];
    const reports = reportsState.data ?? [];
    const activeRescues = reports.filter(
      (r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS" || r.status === "ASSIGNED",
    ).length;
    const closed = reports.filter((r) => r.status === "RESCUED" || r.status === "CLOSED");
    const resolutionRate = reports.length
      ? Math.round((closed.length / reports.length) * 100)
      : 0;
    const durations = reports.filter((r) => r.durationMins).map((r) => r.durationMins!);
    const avgResponse = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    return {
      totalUsers: users.length,
      totalNgos: ngos.length,
      totalReports: reports.length,
      activeRescues,
      resolutionRate,
      avgResponse,
    };
  }, [usersState.data, ngosState.data, reportsState.data]);

  const roleDistribution = useMemo(() => {
    const users = usersState.data ?? [];
    const counts: Record<string, number> = {};
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] ?? 0) + 1;
    });
    return Object.entries(counts).map(([role, value]) => ({ name: role, value }));
  }, [usersState.data]);

  const areaBreakdown = useMemo(() => {
    const reports = reportsState.data ?? [];
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.area] = (counts[r.area] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([area, value]) => ({ area, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [reportsState.data]);

  const pendingNgos = (ngosState.data ?? []).filter((n) => n.verification === "PENDING");
  const trend = seriesForRange("30d");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Platform Overview"
        description="Live snapshot of users, NGOs, rescues and system health across ResQ Paws."
      />

      {loading ? (
        <StatSkeletonRow count={6} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <StatCard label="Total users" value={stats.totalUsers} icon={Users} tone="primary" />
          <StatCard label="Partner NGOs" value={stats.totalNgos} icon={Building2} tone="info" />
          <StatCard
            label="Total reports"
            value={stats.totalReports}
            icon={Activity}
            tone="neutral"
          />
          <StatCard
            label="Active rescues"
            value={stats.activeRescues}
            icon={Truck}
            tone="warning"
          />
          <StatCard
            label="Resolution rate"
            value={`${stats.resolutionRate}%`}
            icon={ShieldCheck}
            tone="success"
          />
          <StatCard
            label="Avg response time"
            value={`${stats.avgResponse} min`}
            icon={Timer}
            tone="critical"
          />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading title="Reports trend" description="Reported vs rescued animals, last 30 days" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="reported" stroke="var(--color-chart-1)" strokeWidth={2} />
                <Line type="monotone" dataKey="rescued" stroke="var(--color-chart-2)" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <SectionHeading title="Role distribution" description="All registered accounts" />
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleDistribution}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                >
                  {roleDistribution.map((entry) => (
                    <Cell key={entry.name} fill={roleColors[entry.name] ?? "var(--color-chart-5)"} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {roleDistribution.map((entry) => (
              <li key={entry.name} className="inline-flex items-center gap-1.5 capitalize">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: roleColors[entry.name] ?? "var(--color-chart-5)" }}
                />
                {entry.name} · {entry.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading title="Reports by area" description="Top 6 areas by number of reports" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={areaBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="area" stroke="var(--color-muted-foreground)" fontSize={11} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="value" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <SectionHeading title="System health" />
          <ul className="space-y-3 text-sm">
            {[
              { label: "API services", status: "Operational" },
              { label: "Notification service", status: "Operational" },
              { label: "Map & geolocation", status: "Operational" },
              { label: "Background jobs", status: "Operational" },
            ].map((item) => (
              <li key={item.label} className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">{item.label}</span>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  {item.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="card-surface p-5">
          <SectionHeading
            title="Pending verifications"
            description="NGOs waiting for approval"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/ngos">View all</Link>
              </Button>
            }
          />
          {ngosState.loading ? (
            <TableSkeleton rows={3} cols={2} />
          ) : pendingNgos.length === 0 ? (
            <p className="text-sm text-muted-foreground">No NGOs pending verification.</p>
          ) : (
            <ul className="divide-y divide-border">
              {pendingNgos.map((ngo) => (
                <li key={ngo.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{ngo.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{ngo.location}</p>
                  </div>
                  <UserStatusBadge status={ngo.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-surface p-5">
          <SectionHeading
            title="Recent system activity"
            description="Latest platform-wide events"
            actions={
              <Button asChild variant="outline" size="sm">
                <Link to="/admin/activity">View all</Link>
              </Button>
            }
          />
          {activityState.loading ? (
            <TableSkeleton rows={4} cols={2} />
          ) : (
            <ActivityList entries={(activityState.data ?? []).slice(0, 6)} />
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3.5 w-3.5" aria-hidden="true" />
        Data refreshes automatically as new reports and accounts come in.
      </div>
    </div>
  );
}
