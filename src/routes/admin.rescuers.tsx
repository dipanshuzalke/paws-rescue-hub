import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/rescuers")({
  component: AdminRescuers,
});

function AdminRescuers() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
