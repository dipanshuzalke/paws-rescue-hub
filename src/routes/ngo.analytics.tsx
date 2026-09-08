import { createFileRoute } from "@tanstack/react-router";
import { Activity, Building2, ShieldCheck, Timer } from "lucide-react";
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

import { FilterSelect } from "@/components/shared/filter-bar";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { rangeOptions, responseTimeSeries, seriesForRange, type RangeKey } from "@/data/mockAnalytics";
import { useApp } from "@/store/app-store";
import { useAsync } from "@/hooks/use-async";
import { analyticsService } from "@/services/analyticsService";

export const Route = createFileRoute("/ngo/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics · ResQ Paws NGO" },
      {
        name: "description",
        content: "Cases over time, emergency mix, area breakdown and response time trends.",
      },
      { property: "og:title", content: "Analytics · ResQ Paws NGO" },
      {
        property: "og:description",
        content: "Deep-dive performance analytics for your rescue organization.",
      },
    ],
  }),
  component: NgoAnalytics,
});

const emergencyColors: Record<string, string> = {
  CRITICAL: "var(--color-critical)",
  HIGH: "var(--color-warning)",
  MEDIUM: "var(--color-caution)",
  LOW: "var(--color-info)",
};

function NgoAnalytics() {
  const { reports, apiMode } = useApp();
  const [range, setRange] = useState<RangeKey["key"]>("30d");

  const { data: overview, loading: overviewLoading } = useAsync(
    () => (apiMode ? analyticsService.getOverview() : Promise.resolve(null)),
    [apiMode],
  );
  const { data: monthly } = useAsync(
    () => (apiMode ? analyticsService.getMonthly() : Promise.resolve(null)),
    [apiMode],
  );
  const { data: responseTrend } = useAsync(
    () => (apiMode ? analyticsService.getResponseTimeTrend() : Promise.resolve(null)),
    [apiMode],
  );

  const stats = useMemo(() => {
    const closed = reports.filter((r) => r.status === "RESCUED" || r.status === "CLOSED");
    const resolutionRate = overview
      ? overview.totalReports
        ? Math.round((overview.completedRescues / overview.totalReports) * 100)
        : 0
      : !apiMode && reports.length
        ? Math.round((closed.length / reports.length) * 100)
        : 0;
    const durations = reports.filter((r) => r.durationMins).map((r) => r.durationMins!);
    const avgResponse = overview?.avgResponseMins ?? (durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : 0);
    return {
      total: overview?.totalReports ?? (apiMode ? 0 : reports.length),
      resolutionRate,
      avgResponse,
    };
  }, [apiMode, overview, reports]);

  const trend = useMemo(() => {
    if (!apiMode || !monthly) return seriesForRange(range);
    const points = monthly.map((point) => ({
      period: point.month,
      reported: point.reports,
      rescued: point.rescued,
    }));
    if (range === "3m") return points.slice(-3);
    if (range === "6m") return points.slice(-6);
    if (range === "1y") return points;
    return points.slice(-1);
  }, [apiMode, monthly, range]);

  const responseTimeData = apiMode ? responseTrend ?? [] : responseTimeSeries;

  const emergencyMix = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.emergency] = (counts[r.emergency] ?? 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [reports]);

  const areaBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.area] = (counts[r.area] ?? 0) + 1;
    });
    return Object.entries(counts)
      .map(([area, value]) => ({ area, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [reports]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Performance metrics for your rescue organization."
        actions={
          <FilterSelect
            value={range}
            onChange={(v) => setRange(v as RangeKey["key"])}
            label="Range"
            options={rangeOptions.map((r) => ({ value: r.key, label: r.label }))}
            className="w-[150px]"
          />
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total cases"
          value={overviewLoading && apiMode ? "…" : stats.total}
          icon={Activity}
          tone="neutral"
        />
        <StatCard
          label="Resolution rate"
          value={overviewLoading && apiMode ? "…" : `${stats.resolutionRate}%`}
          icon={ShieldCheck}
          tone="success"
        />
        <StatCard
          label="Avg response time"
          value={overviewLoading && apiMode ? "…" : `${stats.avgResponse} min`}
          icon={Timer}
          tone="warning"
        />
        <StatCard label="Areas covered" value={areaBreakdown.length} icon={Building2} tone="info" />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="card-surface p-5 xl:col-span-2">
          <SectionHeading title="Cases over time" description="Reported vs rescued animals" />
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="reportedFillNgo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-chart-1)" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="var(--color-chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="rescuedFillNgo" x1="0" y1="0" x2="0" y2="1">
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
                <Area type="monotone" dataKey="reported" stroke="var(--color-chart-1)" fill="url(#reportedFillNgo)" strokeWidth={2} />
                <Area type="monotone" dataKey="rescued" stroke="var(--color-chart-2)" fill="url(#rescuedFillNgo)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card-surface p-5">
          <SectionHeading title="Emergency distribution" />
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
          <SectionHeading title="Cases by area" />
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
          <SectionHeading title="Response time trend" description="Average minutes to respond" />
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis
                  dataKey={apiMode ? "month" : "period"}
                  stroke="var(--color-muted-foreground)"
                  fontSize={11}
                />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-popover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="minutes" fill="var(--color-chart-3)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
