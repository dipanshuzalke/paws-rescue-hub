import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({
  component: Login,
});

function Login() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
