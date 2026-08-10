import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/contact")({
  component: Contact,
});

function Contact() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
