import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/rescues")({
  component: CitizenRescues,
});

function CitizenRescues() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
