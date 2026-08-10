import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescue-cases/")({
  component: RescueCases,
});

function RescueCases() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
