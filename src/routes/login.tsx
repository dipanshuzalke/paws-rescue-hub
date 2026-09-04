import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiErrorMessage } from "@/lib/api-client";
import { useApp } from "@/store/app-store";
import type { Role } from "@/types";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Log in — ResQ Paws" },
      {
        name: "description",
        content:
          "Sign in to ResQ Paws to report stray animals, accept rescue assignments or manage your organisation.",
      },
      { property: "og:title", content: "Log in — SafePaws" },
      { property: "og:description", content: "Sign in to the SafePaws rescue network." },
    ],
  }),
  component: Login,
});

const roleHome: Record<Role, string> = {
  citizen: "/citizen/dashboard",
  rescuer: "/rescuer/dashboard",
  ngo: "/ngo/dashboard",
  admin: "/admin/dashboard",
};

function Login() {
  const { signIn } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("citizen@demo.com");
  const [password, setPassword] = useState("demo1234");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const me = await signIn(email, password);
      toast.success(`Welcome back, ${me.name}`);
      void navigate({ to: roleHome[me.role] });
    } catch (err) {
      setError(apiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue coordinating rescues."
      footer={
        <>
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary underline underline-offset-4">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={(e) => void onSubmit(e)} className="space-y-4" noValidate>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Password</Label>
            <Link
              to="/forgot-password"
              className="text-xs font-medium text-primary underline underline-offset-4"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <Checkbox defaultChecked /> Keep me signed in
        </label>
        {error ? (
          <p role="alert" className="rounded-lg bg-critical-soft px-3 py-2 text-sm text-critical">
            {error}
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Sign in
        </Button>
      </form>

      <div className="mt-8">
        {/* <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Demo accounts — one click
        </p>
        <div className="mt-3 grid gap-2">
          {demoAccounts.map((a) => (
            <button
              key={a.role}
              type="button"
              onClick={() => void enterAsRole(a.role)}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors hover:border-primary hover:bg-primary-soft/40"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground capitalize">
                  {a.role} · {a.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">{a.blurb}</span>
              </span>
              <span className="shrink-0 text-xs font-medium text-primary">Enter</span>
            </button>
          ))}
        </div> */}
      </div>
    </AuthShell>
  );
}
