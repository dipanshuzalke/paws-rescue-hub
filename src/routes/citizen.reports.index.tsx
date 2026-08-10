import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/reports/")({
  component: CitizenReports,
});

function CitizenReports() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
