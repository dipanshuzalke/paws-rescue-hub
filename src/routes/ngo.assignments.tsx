import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { AssignDialog } from "@/components/ngo/assign-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { RescueReport, RescueStatus } from "@/types";

export const Route = createFileRoute("/ngo/assignments")({
  head: () => ({
    meta: [
      { title: "Assignment Board · ResQ Paws" },
      { name: "description", content: "Track assigned rescues across every stage on a kanban board." },
      { property: "og:title", content: "Assignment Board · ResQ Paws" },
      { property: "og:description", content: "Drag-free kanban view of assigned, accepted, in-progress and rescued cases." },
    ],
  }),
  component: NgoAssignments,
});

const columns: { status: RescueStatus; label: string }[] = [
  { status: "ASSIGNED", label: "Assigned" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "IN_PROGRESS", label: "In Progress" },
  { status: "RESCUED", label: "Rescued" },
];

function BoardCard({ report, onReassign }: { report: RescueReport; onReassign: () => void }) {
  return (
    <div className="card-surface space-y-2 p-3">
      <div className="flex items-start justify-between gap-2">
        <Link
          to="/ngo/requests/$id"
          params={{ id: report.id }}
          className="truncate text-sm font-semibold text-foreground hover:underline"
        >
          #{report.id}
        </Link>
        <PriorityBadge level={report.emergency} />
      </div>
      <p className="truncate text-sm text-foreground">{report.title}</p>
      <p className="truncate text-xs text-muted-foreground">
        {report.area}, {report.city} · {timeAgo(report.updatedAt)}
      </p>
      {report.rescuerName ? (
        <p className="truncate text-xs font-medium text-primary">{report.rescuerName}</p>
      ) : null}
      <div className="flex gap-2 pt-1">
        <Button asChild size="sm" variant="outline" className="flex-1">
          <Link to="/ngo/requests/$id" params={{ id: report.id }}>
            View
          </Link>
        </Button>
        <Button size="sm" className="flex-1" onClick={onReassign}>
          Reassign
        </Button>
      </div>
    </div>
  );
}

function NgoAssignments() {
  const { reports } = useApp();
  const [assignTarget, setAssignTarget] = useState<RescueReport | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Assignment board"
        description="Visualize case progress across your assignment pipeline."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => {
          const items = reports.filter((r) => r.status === col.status);
          return (
            <div key={col.status} className="min-w-0 space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-semibold text-foreground">{col.label}</h2>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {items.length}
                </span>
              </div>
              <div className="space-y-3">
                {items.length ? (
                  items.map((r) => (
                    <BoardCard key={r.id} report={r} onReassign={() => setAssignTarget(r)} />
                  ))
                ) : (
                  <EmptyState title="No cases" className="py-8" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      <AssignDialog report={assignTarget} open={!!assignTarget} onOpenChange={(v) => !v && setAssignTarget(null)} />
    </div>
  );
}
