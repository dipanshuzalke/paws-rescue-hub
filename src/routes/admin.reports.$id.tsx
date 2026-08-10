import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/reports/$id")({
  component: AdminReportDetail,
});

function AdminReportDetail() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
