import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/settings")({
  component: CitizenSettings,
});

function CitizenSettings() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
