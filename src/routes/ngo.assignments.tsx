import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/ngo/assignments")({
  component: NgoAssignments,
});

function NgoAssignments() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
