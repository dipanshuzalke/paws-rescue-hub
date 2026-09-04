import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  CheckCircle2,
  ClipboardList,
  Gauge,
  HeartHandshake,
  MapPin,
  PhoneCall,
  ShieldCheck,
  Siren,
  Truck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/how-it-works")({
  head: () => ({
    meta: [
      { title: "How It Works — ResQ Paws" },
      {
        name: "description",
        content:
          "See exactly how ResQ Paws works for citizens, rescuers, NGOs and administrators — from reporting a stray to recovery.",
      },
      { property: "og:title", content: "How It Works — ResQ Paws" },
      {
        property: "og:description",
        content: "The step-by-step rescue coordination process for every role on ResQ Paws.",
      },
    ],
  }),
  component: HowItWorks,
});

const overallSteps = [
  { icon: Siren, title: "Report", body: "Anyone spots a stray in distress and files a report with photo and location." },
  { icon: BellRing, title: "Alert", body: "Nearby verified rescuers and partner NGOs are notified instantly." },
  { icon: Truck, title: "Rescue", body: "A rescuer accepts, reaches the spot and updates the case live." },
  { icon: HeartHandshake, title: "Recover", body: "Treatment and outcome are logged so everyone stays informed." },
];

interface RoleFlow {
  role: string;
  icon: LucideIcon;
  intro: string;
  steps: { title: string; body: string }[];
  cta: { to: string; label: string };
}

const roleFlows: RoleFlow[] = [
  {
    role: "Citizens",
    icon: Users,
    intro: "See an animal in distress? Reporting takes less than a minute.",
    steps: [
      { title: "Spot & report", body: "Snap a photo, drop a location pin and describe the animal's condition." },
      { title: "Get notified", body: "Track your report as it's assigned, accepted and worked on." },
      { title: "Follow progress", body: "Receive live status updates and photos from the rescue team." },
      { title: "See the outcome", body: "Know exactly how the story ends — treated, sheltered or reunited." },
    ],
    cta: { to: "/citizen/report", label: "Report an animal" },
  },
  {
    role: "Rescuers",
    icon: ShieldCheck,
    intro: "Get matched to nearby cases ranked by urgency and distance.",
    steps: [
      { title: "Receive alerts", body: "Nearby requests are pushed to you, prioritised by severity." },
      { title: "Accept a case", body: "Review details and accept the ones you can respond to." },
      { title: "Navigate & rescue", body: "Get directions, then update the case live from the field." },
      { title: "Close the loop", body: "Log the outcome so the reporter and NGO have a full record." },
    ],
    cta: { to: "/register", label: "Become a rescuer" },
  },
  {
    role: "NGOs",
    icon: Building2,
    intro: "Coordinate your rescuers and keep every case accountable.",
    steps: [
      { title: "Triage requests", body: "Review incoming reports across your coverage area." },
      { title: "Assign the right rescuer", body: "Match cases to available rescuers by proximity and skill." },
      { title: "Monitor live", body: "Track every active rescue on a shared operations view." },
      { title: "Measure impact", body: "See response times, outcomes and rescuer performance." },
    ],
    cta: { to: "/register", label: "Register your NGO" },
  },
  {
    role: "Administrators",
    icon: ClipboardList,
    intro: "Keep the whole network verified, safe and accountable.",
    steps: [
      { title: "Verify organisations", body: "Review and approve new NGOs joining the network." },
      { title: "Monitor activity", body: "Watch live rescues and flag anomalies across the city." },
      { title: "Manage users", body: "Oversee citizens, rescuers and NGO accounts in one place." },
      { title: "Report on outcomes", body: "Track city-wide analytics on response time and recovery." },
    ],
    cta: { to: "/login", label: "Admin login" },
  },
];

function HowItWorks() {
  return (
    <PublicShell>
      <section className="border-b border-border bg-primary-soft/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <Gauge className="h-3.5 w-3.5" aria-hidden="true" />
            The process
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            How ResQ Paws works
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            One coordinated flow connects the person who spots an animal in need with the rescuer and
            organisation who can help — with full visibility at every step.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {overallSteps.map((step, i) => (
            <li key={step.title} className="card-surface relative p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                <step.icon className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <span className="mt-5 block text-xs font-semibold tracking-wide text-muted-foreground">
                STEP {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
              {i < overallSteps.length - 1 ? (
                <ArrowRight
                  className="absolute top-1/2 -right-3.5 hidden h-5 w-5 -translate-y-1/2 text-border lg:block"
                  aria-hidden="true"
                />
              ) : null}
            </li>
          ))}
        </ol>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Role by role</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              A tailored flow for every part of the chain
            </h2>
          </div>

          <div className="mt-12 space-y-10">
            {roleFlows.map((flow) => (
              <Card key={flow.role} className="overflow-hidden">
                <CardContent className="p-6 sm:p-8">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success">
                        <flow.icon className="h-5.5 w-5.5" aria-hidden="true" />
                      </span>
                      <div>
                        <h3 className="font-display text-xl font-bold text-foreground">{flow.role}</h3>
                        <p className="text-sm text-muted-foreground">{flow.intro}</p>
                      </div>
                    </div>
                    {/* <Button asChild variant="outline" className="gap-1.5">
                      <Link to={flow.cta.to}>
                        {flow.cta.label}
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </Link>
                    </Button> */}
                  </div>

                  <ol className="relative mt-8 grid gap-6 border-t border-border pt-6 sm:grid-cols-2 lg:grid-cols-4">
                    {flow.steps.map((step, i) => (
                      <li key={step.title} className="relative pl-9">
                        <span className="absolute top-0 left-0 grid h-6 w-6 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {i + 1}
                        </span>
                        <h4 className="text-sm font-semibold text-foreground">{step.title}</h4>
                        <p className="mt-1 text-xs text-muted-foreground">{step.body}</p>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
