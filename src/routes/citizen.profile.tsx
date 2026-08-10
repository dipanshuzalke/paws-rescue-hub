import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/profile")({
  component: CitizenProfile,
});

function CitizenProfile() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
