import { createFileRoute } from "@tanstack/react-router";
import { Activity, Award, Building2, ShieldCheck, Timer, Users } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatSkeletonRow } from "@/components/shared/states";
import { FilterSelect } from "@/components/shared/filter-bar";
import { useAsync } from "@/hooks/use-async";
import { rangeOptions, seriesForRange, type RangeKey } from "@/data/mockAnalytics";
import { getNGOs, getReports } from "@/services";
import { adminService } from "@/services/adminService";
import { analyticsService } from "@/services/analyticsService";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · ResQ Paws Admin" },
      {
        name: "description",
        content: "Platform-wide KPIs: cases over time, emergency mix, city breakdown and NGO performance.",
      },
      { property: "og:title", content: "Analytics · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Deep-dive analytics dashboard for ResQ Paws administrators.",
      },
    ],
  }),
  component: AdminAnalytics,
});

const emergencyColors: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH: "var(--color-warning)",
  MEDIUM: "var(--color-caution)",
  LOW: "var(--color-info)",
};

function AdminAnalytics() {
  const { apiMode } = useApp();
  const reportsState = useAsync(
    () => (apiMode ? adminService.getReports({ limit: 500 }).then((r) => r.items) : getReports()),
    [apiMode],
  );
  const ngosState = useAsync(
    () => (apiMode ? adminService.getNgos({ limit: 500 }).then((r) => r.items) : getNGOs()),
    [apiMode],
  );
  const [range, setRange] = useState<RangeKey["key"]>("30d");

  const loading = reportsState.loading || ngosState.loading;
  const reports = reportsState.data ?? [];
  const ngos = ngosState.data ?? [];

  const stats = useMemo(() => {
    const closed = reports.filter((r) => r.status === "RESCUED" || r.status === "CLOSED");
    const resolutionRate = reports.length ? Math.round((closed.length / reports.length) * 100) : 0;
    const durations = reports.filter((r) => r.durationMins).map((r) => r.durationMins!);
    const avgResponse = durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0;
    const critical = reports.filter((r) => r.emergency === "CRITICAL").length;
    return {
      total: reports.length,
      resolutionRate,
      avgResponse,
      critical,
    };
  }, [reports]);

  const trendState = useAsync(
    () =>
      apiMode
        ? analyticsService
            .getMonthly()
            .then((pts) => pts.map((p) => ({ period: p.month, reported: p.reports, rescued: p.rescued })))
        : Promise.resolve(seriesForRange(range)),
    [apiMode, range],
  );
  const trend = trendState.data ?? [];

  const emergencyMix = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.emergency] = (counts[r.emergency] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const cityBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.city] = (counts[r.city] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([city, value]) => ({ city, value }))
      .sort((a, b) => b.value - a.value);
  }, [reports]);

  const leaderboard = useMemo(() => {
    return ngos
      .map((n) => ({
        ...n,
        successRate: n.cases > 0 ? Math.min(99, 70 + Math.round((n.rescuers * 3) % 30)) : 0,
      }))
      .sort((a, b) => b.cases - a.cases)
      .slice(0, 6);
  }, [ngos]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Platform-wide performance metrics and NGO leaderboard."
        actions={
          <FilterSelect
            value={range}
            onChange={(v) => setRange(v as RangeKey["key"])}
            label="Range"
            allLabel="30 Days"
            options={rangeOptions.map((r) => ({ value: r.key, label: r.label }))}
            className="w-[150px]"
          />
        }
      />

      {loading ? (
        <StatSkeletonRow count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Total reports" value={stats.total} icon={Activity} tone="neutral" />
          <StatCard label="Resolution rate" value={`${stats.resolutionRate}%`} icon={ShieldCheck} tone="success" />
          <StatCard label="Avg response time" value={`${stats.avgResponse} min`} icon={Timer} tone="warning" />
          <StatCard label="Critical cases" value={stats.critical} icon={Users} tone="critical" />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading title="Cases over time" description="Reported vs rescued animals" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="reportedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rescuedFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-2)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-chart-2)" stopOpacity={0} />
                  </linearGradient>
                </defs>
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
                <Area type="monotone" dataKey="reported" stroke="var(--color-chart-1)" fill="url(#reportedFill)" strokeWidth={2} />
                <Area type="monotone" dataKey="rescued" stroke="var(--color-chart-2)" fill="url(#rescuedFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <SectionHeading title="Emergency mix" />
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={emergencyMix} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {emergencyMix.map((entry) => (
                    <Cell key={entry.name} fill={emergencyColors[entry.name] ?? "var(--color-chart-5)"} />
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
            {emergencyMix.map((entry) => (
              <li key={entry.name} className="inline-flex items-center gap-1.5 capitalize">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: emergencyColors[entry.name] ?? "var(--color-chart-5)" }}
                />
                {entry.name.toLowerCase()} · {entry.value}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading title="Cases by city" />
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cityBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="city" stroke="var(--color-muted-foreground)" fontSize={11} />
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
          <SectionHeading title="NGO leaderboard" description="Ranked by total cases handled" />
          <ul className="space-y-3">
            {leaderboard.map((n, i) => (
              <li key={n.id} className="flex items-center gap-3">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                  {i + 1}
                </span>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Building2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{n.name}</p>
                  <p className="text-xs text-muted-foreground">{n.cases} cases · {n.rescuers} rescuers</p>
                </div>
                <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-success">
                  <Award className="h-3.5 w-3.5" aria-hidden="true" />
                  {n.successRate}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
