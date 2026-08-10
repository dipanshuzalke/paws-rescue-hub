import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/history")({
  component: CitizenHistory,
});

function CitizenHistory() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
