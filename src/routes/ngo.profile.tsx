import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/profile")({
  component: NgoProfile,
});

function NgoProfile() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
