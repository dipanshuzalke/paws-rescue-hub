import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, CheckCircle2, Eye, EyeOff, Loader2, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { AuthShell } from "@/components/layout/auth-shell";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { apiErrorMessage } from "@/lib/api-client";
import { useApp } from "@/store/app-store";
import type { Role } from "@/types";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create an account — SafePaws" },
      {
        name: "description",
        content:
          "Join SafePaws as a citizen reporter, verified rescuer or partner NGO and help coordinate stray animal rescues in Nagpur.",
      },
      { property: "og:title", content: "Create an account — SafePaws" },
      {
        property: "og:description",
        content: "Sign up as a citizen, rescuer or NGO on the ResQ Paws rescue network.",
      },
    ],
  }),
  component: Register,
});

type SignupRole = Extract<Role, "citizen" | "rescuer" | "ngo">;

const roleHome: Record<SignupRole, string> = {
  citizen: "/citizen/dashboard",
  rescuer: "/rescuer/dashboard",
  ngo: "/ngo/dashboard",
};

const roleCards: { role: SignupRole; icon: LucideIcon; title: string; body: string }[] = [
  {
    role: "citizen",
    icon: Users,
    title: "Citizen",
    body: "Report distressed animals and track rescues near you.",
  },
  {
    role: "rescuer",
    icon: ShieldCheck,
    title: "Rescuer",
    body: "Accept assignments and respond to nearby cases.",
  },
  {
    role: "ngo",
    icon: Building2,
    title: "NGO",
    body: "Manage a team of rescuers and triage incoming requests.",
  },
];

interface FormState {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  location: string;
  organization: string;
  regNumber: string;
  about: string;
  terms: boolean;
}

const initialForm: FormState = {
  name: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
  location: "",
  organization: "",
  regNumber: "",
  about: "",
  terms: false,
};

function Register() {
  const navigate = useNavigate();
  const { signUp } = useApp();
  const [role, setRole] = useState<SignupRole>("citizen");
  const [form, setForm] = useState<FormState>(initialForm);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = "Full name is required.";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email address.";
    if (!/^[+\d][\d\s-]{7,}$/.test(form.phone)) next.phone = "Enter a valid phone number.";
    if (form.password.length < 8) next.password = "Password must be at least 8 characters.";
    if (form.confirmPassword !== form.password) next.confirmPassword = "Passwords do not match.";
    if (!form.location.trim()) next.location = "Location is required.";
    if (role === "rescuer" && !form.organization.trim())
      next.organization = "Tell us which NGO or team you work with (or 'Independent').";
    if (role === "ngo") {
      if (!form.organization.trim()) next.organization = "Organisation name is required.";
      if (!form.regNumber.trim()) next.regNumber = "Registration number is required.";
      if (!form.about.trim()) next.about = "Give a short description of your organisation.";
    }
    if (!form.terms) next.terms = "You must accept the terms to continue.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await signUp({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        role,
        ...(role === "ngo"
          ? {
              organizationName: form.organization.trim(),
              organizationDescription: form.about.trim(),
            }
          : {}),
      });
      toast.success("Account created", {
        description:
          role === "ngo"
            ? "Your organization profile is pending admin verification."
            : "You are now signed in.",
      });
      void navigate({ to: roleHome[user.role as SignupRole] });
    } catch (err) {
      setErrors({ email: apiErrorMessage(err) });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Choose how you'd like to help and tell us a little about yourself."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary underline underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <div className="mb-6 grid gap-2.5 sm:grid-cols-3">
        {roleCards.map((r) => (
          <button
            key={r.role}
            type="button"
            onClick={() => setRole(r.role)}
            aria-pressed={role === r.role}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border p-3.5 text-left transition-colors",
              role === r.role
                ? "border-primary bg-primary-soft/60 ring-2 ring-primary/30"
                : "border-border hover:bg-muted",
            )}
          >
            <span
              className={cn(
                "grid h-9 w-9 place-items-center rounded-lg",
                role === r.role
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              <r.icon className="h-4.5 w-4.5" aria-hidden="true" />
            </span>
            <span className="text-sm font-semibold text-foreground">{r.title}</span>
            <span className="text-xs text-muted-foreground">{r.body}</span>
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="name">{role === "ngo" ? "Contact person" : "Full name"}</Label>
            <Input id="name" value={form.name} onChange={(e) => set("name", e.target.value)} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+91 90000 00000"
            />
            {errors.phone ? <p className="text-xs text-destructive">{errors.phone}</p> : null}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
          {errors.email ? <p className="text-xs text-destructive">{errors.email}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location">Location (area, city)</Label>
          <Input
            id="location"
            value={form.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="e.g. Dharampeth, Nagpur"
          />
          {errors.location ? <p className="text-xs text-destructive">{errors.location}</p> : null}
        </div>

        {role === "rescuer" ? (
          <div className="space-y-2">
            <Label htmlFor="organization">NGO / team affiliation</Label>
            <Input
              id="organization"
              value={form.organization}
              onChange={(e) => set("organization", e.target.value)}
              placeholder="e.g. Helping Paws NGO, or Independent"
            />
            {errors.organization ? (
              <p className="text-xs text-destructive">{errors.organization}</p>
            ) : null}
          </div>
        ) : null}

        {role === "ngo" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="organization">Organisation name</Label>
                <Input
                  id="organization"
                  value={form.organization}
                  onChange={(e) => set("organization", e.target.value)}
                />
                {errors.organization ? (
                  <p className="text-xs text-destructive">{errors.organization}</p>
                ) : null}
              </div>
              <div className="space-y-2">
                <Label htmlFor="regNumber">Registration number</Label>
                <Input
                  id="regNumber"
                  value={form.regNumber}
                  onChange={(e) => set("regNumber", e.target.value)}
                  placeholder="e.g. NGO/2019/00452"
                />
                {errors.regNumber ? (
                  <p className="text-xs text-destructive">{errors.regNumber}</p>
                ) : null}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="about">About your organisation</Label>
              <Textarea
                id="about"
                rows={3}
                value={form.about}
                onChange={(e) => set("about", e.target.value)}
                placeholder="What kind of rescues do you focus on, how many rescuers, coverage area..."
              />
              {errors.about ? <p className="text-xs text-destructive">{errors.about}</p> : null}
            </div>
            <p className="rounded-lg bg-info-soft px-3 py-2 text-xs text-info">
              NGO accounts are reviewed by our team before they go live, usually within 24-48 hours.
            </p>
          </>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>

            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                minLength={8}
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {errors.password ? <p className="text-xs text-destructive">{errors.password}</p> : null}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>

            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                minLength={8}
                value={form.confirmPassword}
                onChange={(e) => set("confirmPassword", e.target.value)}
                className="pr-10"
              />

              <button
                type="button"
                onClick={() => setShowConfirmPassword((s) => !s)}
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-muted-foreground hover:text-foreground"
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {errors.confirmPassword ? (
              <p className="text-xs text-destructive">{errors.confirmPassword}</p>
            ) : null}
          </div>
        </div>
        <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
          <Checkbox
            checked={form.terms}
            onCheckedChange={(v) => set("terms", v === true)}
            className="mt-0.5"
          />
          <span>
            I agree to the{" "}
            <Link to="/terms" className="font-medium text-primary underline underline-offset-4">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-medium text-primary underline underline-offset-4">
              Privacy Policy
            </Link>
            .
          </span>
        </label>
        {errors.terms ? <p className="text-xs text-destructive">{errors.terms}</p> : null}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
          )}
          Create {role === "ngo" ? "organisation" : role} account
        </Button>
      </form>
    </AuthShell>
  );
}
