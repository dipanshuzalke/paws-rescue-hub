import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/terms")({
  component: Terms,
});

function Terms() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
