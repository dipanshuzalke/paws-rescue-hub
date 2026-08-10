import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/rescuers")({
  component: NgoRescuers,
});

function NgoRescuers() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
