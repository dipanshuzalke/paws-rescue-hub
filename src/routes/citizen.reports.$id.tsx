import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/reports/$id")({
  component: CitizenReportDetail,
});

function CitizenReportDetail() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
