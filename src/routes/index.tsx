import { Link, createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  ClipboardCheck,
  Clock3,
  HeartHandshake,
  MapPin,
  PawPrint,
  ShieldCheck,
  Siren,
  Truck,
  Users,
} from "lucide-react";

import heroImage from "@/assets/hero-rescue.jpg";
import { PublicShell } from "@/components/layout/public-shell";
import { CaseCard } from "@/components/rescue/case-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockNGOs } from "@/data/mockNGOs";
import { mockReports } from "@/data/mockReports";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafePaws — Report & Track Stray Animal Rescues" },
      {
        name: "description",
        content:
          "One coordinated platform for citizens, rescuers and NGOs: report a stray animal in distress, get it assigned to the nearest rescuer, and follow every step to recovery.",
      },
      { property: "og:title", content: "SafePaws — Report & Track Stray Animal Rescues" },
      {
        property: "og:description",
        content:
          "Report a stray animal in seconds. Nearby rescuers and partner NGOs are alerted instantly.",
      },
    ],
  }),
  component: Index,
});

const steps = [
  {
    icon: Siren,
    title: "Report",
    body: "Snap a photo, drop a pin and describe the animal's condition. It takes under a minute.",
  },
  {
    icon: BellRing,
    title: "Alert",
    body: "Nearby verified rescuers and partner NGOs are notified instantly, prioritised by severity.",
  },
  {
    icon: Truck,
    title: "Rescue",
    body: "A rescuer accepts, navigates to the location and updates the case live from the field.",
  },
  {
    icon: HeartHandshake,
    title: "Recover",
    body: "Treatment, shelter and outcome are logged so the reporter always knows what happened.",
  },
];

const audiences = [
  {
    icon: Users,
    role: "Citizens",
    body: "Report distressed animals and follow the rescue in real time with photo updates.",
    to: "/citizen/dashboard",
    cta: "Citizen dashboard",
  },
  {
    icon: ShieldCheck,
    role: "Rescuers",
    body: "Receive nearby assignments ranked by urgency and distance, and update cases on the go.",
    to: "/rescuer/dashboard",
    cta: "Rescuer dashboard",
  },
  {
    icon: Building2,
    role: "NGOs",
    body: "Triage incoming requests, assign the right rescuer and measure your response times.",
    to: "/ngo/dashboard",
    cta: "NGO dashboard",
  },
  {
    icon: ClipboardCheck,
    role: "Administrators",
    body: "Verify organisations, monitor live rescues and keep the whole network accountable.",
    to: "/admin/dashboard",
    cta: "Admin dashboard",
  },
];

const impact = [
  { value: "100+", label: "Rescues coordinated" },
  { value: "18 min", label: "Median response time" },
  { value: "40", label: "Verified rescuers" },
  { value: "6", label: "Partner NGOs" },
];

function Index() {
  const featured = mockReports.slice(0, 3);

  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border bg-primary-soft/40">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24">
          <div className="min-w-0">
            <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
              <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              Community rescue network
            </Badge>
            <h1 className="mt-5 font-display text-4xl leading-[1.08] font-extrabold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Every stray deserves a
              <span className="text-primary"> fast response</span>.
            </h1>
            <p className="mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
              SafePaws connects the person who spots an injured animal with the rescuer who can
              reach it first — and keeps everyone informed until the animal is safe.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg" className="gap-2">
                <Link to="/citizen/report">
                  <Siren className="h-4.5 w-4.5" aria-hidden="true" />
                  Report an Animal
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="gap-2">
                <Link to="/how-it-works">
                  How it works
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
            <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
              {impact.map((s) => (
                <div key={s.label} className="min-w-0">
                  <dt className="sr-only">{s.label}</dt>
                  <dd>
                    <span className="block font-display text-2xl font-bold text-foreground">
                      {s.value}
                    </span>
                    <span className="block text-xs text-muted-foreground">{s.label}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="overflow-hidden rounded-3xl border border-border shadow-xl">
              <img
                src={heroImage}
                alt="A volunteer rescuer carefully lifting an injured street dog into a rescue van"
                className="h-[320px] w-full object-cover sm:h-[440px]"
                loading="eager"
              />
            </div>
            <Card className="absolute -bottom-6 left-4 w-[260px] border-border/80 shadow-lg backdrop-blur sm:left-8">
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-critical-soft text-critical">
                  <Clock3 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    Critical case accepted
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Rescuer 1.2 km away · ETA 9 min
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">How it works</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From a sighting to a safe animal, in four steps
          </h2>
        </div>
        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <li key={step.title} className="card-surface relative p-6">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary">
                <step.icon className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <span className="mt-5 block text-xs font-semibold tracking-wide text-muted-foreground">
                STEP {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for the whole chain
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              One platform, four coordinated roles
            </h2>
            <p className="mt-4 text-muted-foreground">
              Explore any dashboard — this prototype ships with realistic demo data for every role.
            </p>
          </div>
          <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {audiences.map((a) => (
              <Card key={a.role} className="flex flex-col">
                <CardContent className="flex flex-1 flex-col p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success">
                    <a.icon className="h-5.5 w-5.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-foreground">{a.role}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{a.body}</p>
                  <Button asChild variant="ghost" className="mt-5 justify-start gap-1.5 px-0">
                    <Link to={a.to}>
                      {a.cta}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Recent cases */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-4">
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">Live feed</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Recent rescue cases
            </h2>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to="/rescue-cases">View all</Link>
          </Button>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featured.map((report) => (
            <CaseCard
              key={report.id}
              report={report}
              to="/rescue-cases/$id"
              params={{ id: report.id }}
            />
          ))}
        </div>
      </section>

      {/* Partners */}
      <section className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <h2 className="text-center text-sm font-semibold tracking-wide text-muted-foreground uppercase">
            Partner organisations on the network
          </h2>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {mockNGOs.map((ngo) => (
              <li
                key={ngo.id}
                className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground"
              >
                <Building2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{ngo.name}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
          <MapPin className="mx-auto h-8 w-8 text-primary-foreground" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
            Spotted an animal in distress?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Reporting takes less than a minute and immediately alerts the closest available rescuer.
          </p>
          <Button asChild size="lg" variant="secondary" className="mt-8 gap-2">
            <Link to="/citizen/report">
              <Siren className="h-4.5 w-4.5" aria-hidden="true" />
              Report an Animal
            </Link>
          </Button>
        </div>
      </section>
    </PublicShell>
  );
}
