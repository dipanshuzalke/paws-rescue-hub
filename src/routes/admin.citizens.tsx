import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/citizens")({
  component: AdminCitizens,
});

function AdminCitizens() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
