import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/active")({
  component: NgoActive,
});

function NgoActive() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
