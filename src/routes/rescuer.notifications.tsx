import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/notifications")({
  component: RescuerNotifications,
});

function RescuerNotifications() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
