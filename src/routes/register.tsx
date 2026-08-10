import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
