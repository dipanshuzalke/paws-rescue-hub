import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/how-it-works")({
  component: HowItWorks,
});

function HowItWorks() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
