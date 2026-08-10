import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/map")({
  component: RescuerMap,
});

function RescuerMap() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
