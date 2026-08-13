import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Building2, ClipboardCheck, ShieldCheck, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { toast } from "sonner";

import { PublicShell } from "@/components/layout/public-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { demoAccounts } from "@/data/mockUsers";
import { useApp } from "@/store/app-store";
import type { Role } from "@/types";

export const Route = createFileRoute("/demo")({
  head: () => ({
    meta: [
      { title: "Try a Demo — ResQ Paws" },
      {
        name: "description",
        content: "Instantly sign in as a citizen, rescuer, NGO or administrator to explore ResQ Paws.",
      },
      { property: "og:title", content: "Try a Demo — ResQ Paws" },
      { property: "og:description", content: "Explore any ResQ Paws dashboard with one click." },
    ],
  }),
  component: DemoSwitcher,
});

const roleHome: Record<Role, string> = {
  citizen: "/citizen/dashboard",
  rescuer: "/rescuer/dashboard",
  ngo: "/ngo/dashboard",
  admin: "/admin/dashboard",
};

const roleIcons: Record<Role, LucideIcon> = {
  citizen: Users,
  rescuer: ShieldCheck,
  ngo: Building2,
  admin: ClipboardCheck,
};

function DemoSwitcher() {
  const { loginAs } = useApp();
  const navigate = useNavigate();

  const enter = async (role: Role) => {
    try {
      await loginAs(role);
      toast.success(`Signed in as ${role}`, { description: "Demo session account." });
      void navigate({ to: roleHome[role] });
    } catch {
      toast.error("Unable to sign in with the demo account.");
    }
  };

  return (
    <PublicShell>
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Try ResQ Paws instantly
          </h1>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">
            Jump straight into any dashboard with a demo account — no sign up required. All data shown
            is mock data for this prototype.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {demoAccounts.map((account) => {
            const Icon = roleIcons[account.role];
            return (
              <Card key={account.role} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                    <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                  </span>
                  <h2 className="mt-5 font-display text-lg font-bold text-foreground capitalize">
                    {account.role}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-foreground">{account.name}</p>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{account.blurb}</p>
                  <Button className="mt-5 w-full" onClick={() => enter(account.role)}>
                    Enter as {account.role}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>
    </PublicShell>
  );
}
