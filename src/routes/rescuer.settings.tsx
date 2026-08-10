import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/settings")({
  component: RescuerSettings,
});

function RescuerSettings() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
