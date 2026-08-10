import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  component: Privacy,
});

function Privacy() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
