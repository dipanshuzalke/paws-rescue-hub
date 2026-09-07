import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatDuration } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { Emergency } from "@/types";

export const Route = createFileRoute("/rescuer/history")({
  head: () => ({
    meta: [
      { title: "Rescue History · ResQ Paws" },
      {
        name: "description",
        content: "Review your completed rescues and weekly performance trends.",
      },
      { property: "og:title", content: "Rescue History · ResQ Paws" },
      {
        property: "og:description",
        content: "Review your completed rescues and weekly performance trends.",
      },
    ],
  }),
  component: RescuerHistory,
});

const emergencyOptions: { value: Emergency; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

function RescuerHistory() {
  const { reports, user } = useApp();
  const [search, setSearch] = useState("");
  const [emergency, setEmergency] = useState("all");

  const completed = useMemo(
    () =>
      reports.filter(
        (r) =>
          r.rescuerId === user?.id && (r.status === "RESCUED" || r.status === "CLOSED"),
      ),
    [reports, user],
  );

  const filtered = useMemo(
    () =>
      completed.filter((r) => {
        if (emergency !== "all" && r.emergency !== emergency) return false;
        if (search && !`${r.title} ${r.area} ${r.id}`.toLowerCase().includes(search.toLowerCase()))
          return false;
        return true;
      }),
    [completed, emergency, search],
  );

  const weekly = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - 6 + index);
      return {
        date,
        period: date.toLocaleDateString("en-IN", { weekday: "short" }),
        rescued: 0,
      };
    });

    completed.forEach((report) => {
      const completedAt = report.closedAt ?? report.rescuedAt ?? report.updatedAt;
      const date = new Date(completedAt);
      date.setHours(0, 0, 0, 0);
      const day = days.find((item) => item.date.getTime() === date.getTime());
      if (day) day.rescued += 1;
    });

    return days.map(({ period, rescued }) => ({ period, rescued }));
  }, [completed]);
  const avgMins = completed.length
    ? Math.round(
        completed.reduce((sum, r) => sum + (r.durationMins ?? 0), 0) / completed.length,
      )
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Rescue History" description="Your completed rescue record." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total Completed" value={completed.length} tone="success" />
        <StatCard label="Avg Duration" value={formatDuration(avgMins)} tone="info" animate={false} />
        <StatCard
          label="Critical Cases"
          value={completed.filter((r) => r.emergency === "CRITICAL").length}
          tone="critical"
        />
      </div>

      <section className="card-surface p-4">
        <SectionHeading
          title="Rescues per week"
          description="A quick look at your recent activity."
        />
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weekly}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="period" stroke="var(--color-muted-foreground)" fontSize={12} />
              <YAxis stroke="var(--color-muted-foreground)" fontSize={12} allowDecimals={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--color-popover)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 8,
                  color: "var(--color-popover-foreground)",
                }}
              />
              <Bar dataKey="rescued" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by case or area…" />
        <FilterSelect
          value={emergency}
          onChange={setEmergency}
          options={emergencyOptions}
          label="Emergency"
          allLabel="All emergencies"
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="No completed rescues yet" description="Completed cases will appear here." />
      ) : (
        <div className="card-surface overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Emergency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[220px]">
                    <p className="truncate font-medium text-foreground">{r.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      #{r.id} · {r.area}
                    </p>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge level={r.emergency} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell>{formatDuration(r.durationMins)}</TableCell>
                  <TableCell>{r.closedAt ? formatDate(r.closedAt) : formatDate(r.updatedAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
