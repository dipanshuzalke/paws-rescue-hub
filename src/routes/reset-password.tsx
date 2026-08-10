import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  return <div className="text-sm text-muted-foreground">Coming soon</div>;
}
