import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
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
import type { RescueStatus } from "@/types";

export const Route = createFileRoute("/ngo/history")({
  head: () => ({
    meta: [
      { title: "Rescue History · ResQ Paws" },
      { name: "description", content: "Review completed, closed and cancelled rescue cases." },
      { property: "og:title", content: "Rescue History · ResQ Paws" },
      {
        property: "og:description",
        content: "Search and filter your organization's completed rescue record.",
      },
    ],
  }),
  component: NgoHistory,
});

const historyStatuses: RescueStatus[] = ["RESCUED", "CLOSED", "CANCELLED"];

function NgoHistory() {
  const { reports } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");

  const completed = useMemo(
    () => reports.filter((r) => historyStatuses.includes(r.status)),
    [reports],
  );

  const filtered = useMemo(
    () =>
      completed.filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.rescuerName ?? "").toLowerCase().includes(q)
        );
      }),
    [completed, search, status],
  );

  const rescued = completed.filter((r) => r.status === "RESCUED" || r.status === "CLOSED");
  const cancelled = completed.filter((r) => r.status === "CANCELLED");
  const avgMins = rescued.length
    ? Math.round(rescued.reduce((sum, r) => sum + (r.durationMins ?? 0), 0) / rescued.length)
    : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Case history" description="Completed, closed and cancelled rescue cases." />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard label="Total closed" value={completed.length} tone="neutral" />
        <StatCard label="Successful rescues" value={rescued.length} tone="success" />
        <StatCard label="Avg. duration" value={formatDuration(avgMins)} tone="info" animate={false} />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by case, area or rescuer…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={historyStatuses.map((s) => ({ value: s, label: s.replace("_", " ") }))}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState title="No history yet" description="Closed cases will appear here." />
      ) : (
        <div className="card-surface overflow-x-auto p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Emergency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Rescuer</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Closed</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="max-w-[220px]">
                    <Link
                      to="/ngo/requests/$id"
                      params={{ id: r.id }}
                      className="block truncate text-sm font-medium text-foreground hover:underline"
                    >
                      {r.title}
                    </Link>
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
                  <TableCell className="text-sm text-muted-foreground">
                    {r.rescuerName ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDuration(r.durationMins)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {r.closedAt ? formatDate(r.closedAt) : formatDate(r.updatedAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {cancelled.length > 0 && status === "all" ? (
        <p className="text-xs text-muted-foreground">
          Includes {cancelled.length} cancelled case{cancelled.length === 1 ? "" : "s"}.
        </p>
      ) : null}
    </div>
  );
}
