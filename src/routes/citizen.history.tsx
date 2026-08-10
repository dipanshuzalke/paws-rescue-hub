import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Clock, PawPrint } from "lucide-react";

import { CaseCard } from "@/components/rescue/case-card";
import { EmptyState } from "@/components/shared/states";
import { StatCard } from "@/components/shared/stat-card";
import { formatDuration } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/citizen/history")({
  head: () => ({
    meta: [
      { title: "Rescue History · ResQ Paws" },
      { name: "description", content: "See the outcomes of your completed and closed rescue reports." },
      { property: "og:title", content: "Rescue History · ResQ Paws" },
      { property: "og:description", content: "See the outcomes of your completed and closed rescue reports." },
    ],
  }),
  component: CitizenHistory,
});

function CitizenHistory() {
  const { user, reports } = useApp();
  const history = reports.filter(
    (r) => r.reporterId === user?.id && ["RESCUED", "CLOSED", "CANCELLED"].includes(r.status),
  );
  const withDuration = history.filter((r) => r.durationMins);
  const avg = withDuration.length
    ? Math.round(withDuration.reduce((s, r) => s + (r.durationMins ?? 0), 0) / withDuration.length)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Completed and closed rescue reports.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total closed" value={history.length} icon={PawPrint} tone="primary" />
        <StatCard
          label="Successfully rescued"
          value={history.filter((r) => r.status === "RESCUED" || r.status === "CLOSED").length}
          icon={CheckCircle2}
          tone="success"
        />
        <StatCard label="Avg. duration" value={avg ? formatDuration(avg) : "—"} icon={Clock} tone="info" />
      </div>

      {history.length === 0 ? (
        <EmptyState title="No history yet" description="Completed reports will be listed here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {history.map((r) => (
            <CaseCard key={r.id} report={r} to="/citizen/reports/$id" params={{ id: r.id }} />
          ))}
        </div>
      )}
    </div>
  );
}
