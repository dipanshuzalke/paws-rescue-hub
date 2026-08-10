import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/requests/")({
  component: NgoRequests,
});

function NgoRequests() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
