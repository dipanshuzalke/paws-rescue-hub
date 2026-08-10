import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescuer/profile")({
  component: RescuerProfile,
});

function RescuerProfile() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
