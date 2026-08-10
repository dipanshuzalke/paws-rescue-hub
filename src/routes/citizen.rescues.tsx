import { createFileRoute } from "@tanstack/react-router";
import { Timer } from "lucide-react";

import { CaseCard } from "@/components/rescue/case-card";
import { EmptyState } from "@/components/shared/states";
import { useApp } from "@/store/app-store";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/citizen/rescues")({
  head: () => ({
    meta: [
      { title: "Active Rescues · ResQ Paws" },
      { name: "description", content: "Track your rescue reports currently in progress." },
      { property: "og:title", content: "Active Rescues · ResQ Paws" },
      { property: "og:description", content: "Track your rescue reports currently in progress." },
    ],
  }),
  component: CitizenRescues,
});

function CitizenRescues() {
  const { user, reports } = useApp();
  const active = reports.filter(
    (r) => r.reporterId === user?.id && ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"].includes(r.status),
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Active rescues</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {active.length} rescue{active.length === 1 ? "" : "s"} currently in motion.
        </p>
      </div>
      {active.length === 0 ? (
        <EmptyState title="No active rescues" description="Any rescue in progress will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {active.map((r) => (
            <CaseCard
              key={r.id}
              report={r}
              to="/citizen/reports/$id"
              params={{ id: r.id }}
              footer={
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning-foreground">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  Updated {timeAgo(r.updatedAt)}
                </span>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
