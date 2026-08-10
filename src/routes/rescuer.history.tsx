import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/history")({
  component: RescuerHistory,
});

function RescuerHistory() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
