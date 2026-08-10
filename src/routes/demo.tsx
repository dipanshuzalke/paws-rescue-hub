import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/demo")({
  component: DemoSwitcher,
});

function DemoSwitcher() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
