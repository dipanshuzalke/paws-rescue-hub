import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/reports/")({
  component: AdminReports,
});

function AdminReports() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
