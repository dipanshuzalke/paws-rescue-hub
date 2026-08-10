import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/ngos")({
  component: AdminNgos,
});

function AdminNgos() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
