import { Link, createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { useState } from "react";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api-client";
import { authService } from "@/services/authService";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Forgot password — ResQ Paws" },
      {
        name: "description",
        content: "Reset your ResQ Paws account password by email.",
      },
      { property: "og:title", content: "Forgot password — ResQ Paws" },
      { property: "og:description", content: "Reset your ResQ Paws account password." },
    ],
  }),
  component: ForgotPassword,
});

function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await authService.forgotPassword(email.trim());
      setLoading(false);
      setSent(true);
    } catch (requestError) {
      setLoading(false);
      setError(apiErrorMessage(requestError));
    }
  };

  if (sent) {
    return (
      <AuthShell
        title="Check your email"
        subtitle="We've sent password reset instructions."
        footer={
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Back to login
          </Link>
        }
      >
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-success-soft text-success">
            <MailCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-4 text-sm text-foreground">
            If an account exists for <span className="font-semibold">{email}</span>, a reset link is on
            its way. It usually arrives within a couple of minutes.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to reset it."
      footer={
        <>
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Back to login
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          Send reset link
        </Button>
      </form>
    </AuthShell>
  );
}
