import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/history")({
  component: NgoHistory,
});

function NgoHistory() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
