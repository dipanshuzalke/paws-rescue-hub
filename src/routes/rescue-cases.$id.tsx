import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/rescue-cases/$id")({
  component: RescueCaseDetail,
});

function RescueCaseDetail() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
