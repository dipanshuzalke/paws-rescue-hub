import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/active-rescues")({
  component: AdminActiveRescues,
});

function AdminActiveRescues() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
