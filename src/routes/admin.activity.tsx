import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/activity")({
  component: AdminActivity,
});

function AdminActivity() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
