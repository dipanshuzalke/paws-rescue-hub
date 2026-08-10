import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/notifications")({
  component: CitizenNotifications,
});

function CitizenNotifications() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
