import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/analytics")({
  component: NgoAnalytics,
});

function NgoAnalytics() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
