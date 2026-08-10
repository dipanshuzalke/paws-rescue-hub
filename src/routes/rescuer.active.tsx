import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/active")({
  component: RescuerActive,
});

function RescuerActive() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
