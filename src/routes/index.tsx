import { Link, createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BellRing,
  Building2,
  ClipboardCheck,
  HeartHandshake,
  Loader2,
  MapPin,
  PawPrint,
  ShieldCheck,
  Siren,
  Truck,
  Users,
} from "lucide-react";
import { useEffect } from "react";

import birdImage from "@/assets/case-bird.jpg";
import catImage from "@/assets/case-cat.jpg";
import cowImage from "@/assets/case-cow.jpg";
import dogImage from "@/assets/case-dog.jpg";
import heroImage from "@/assets/hero-rescue.jpg";
import { PublicShell } from "@/components/layout/public-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useScrollReveal } from "@/hooks/use-reveal";
import { useApp } from "@/store/app-store";
import type { Role } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SafePaws — Report & Coordinate Stray Animal Rescues" },
      {
        name: "description",
        content:
          "One coordinated platform for citizens, rescuers and NGOs: report a stray animal in distress, get it assigned to a nearby rescuer, and follow every step to recovery.",
      },
      { property: "og:title", content: "SafePaws — Report & Coordinate Stray Animal Rescues" },
      {
        property: "og:description",
        content:
          "Report a stray animal in distress. Rescuers and partner organisations coordinate the response in one place.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const roleHome: Record<Role, string> = {
  citizen: "/citizen/dashboard",
  rescuer: "/rescuer/dashboard",
  ngo: "/ngo/dashboard",
  admin: "/admin/dashboard",
};

const steps = [
  {
    icon: Siren,
    title: "Report",
    body: "Add a photo, drop the location on the map and describe the animal's condition and urgency.",
  },
  {
    icon: BellRing,
    title: "Coordinate",
    body: "The request reaches rescuers and partner organisations, who triage it by severity and area.",
  },
  {
    icon: Truck,
    title: "Rescue",
    body: "A rescuer accepts the case, reaches the animal and updates the status live from the field.",
  },
  {
    icon: HeartHandshake,
    title: "Recover",
    body: "Treatment and outcome are logged on the case, so the person who reported it always knows.",
  },
];

const audiences = [
  {
    icon: Users,
    role: "Citizens",
    body: "Report an animal in distress and follow the rescue through every status update.",
  },
  {
    icon: ShieldCheck,
    role: "Rescuers",
    body: "See requests near you ranked by urgency, accept assignments and update cases on the go.",
  },
  {
    icon: Building2,
    role: "NGOs",
    body: "Triage incoming requests, assign the right rescuer and review your team's response times.",
  },
  {
    icon: ClipboardCheck,
    role: "Administrators",
    body: "Verify organisations, oversee active rescues and keep the whole network accountable.",
  },
];

const coverage = [
  { src: dogImage, label: "Dogs", alt: "A street dog resting on a pavement" },
  { src: catImage, label: "Cats", alt: "A stray cat looking into the camera" },
  { src: cowImage, label: "Cattle", alt: "Cattle standing on an urban roadside" },
  { src: birdImage, label: "Birds", alt: "An injured bird held carefully in two hands" },
];

function Index() {
  const { user, sessionResolved } = useApp();
  const navigate = useNavigate();

  useEffect(() => {
    if (sessionResolved && user) {
      void navigate({ to: roleHome[user.role], replace: true });
    }
  }, [sessionResolved, user, navigate]);

  useScrollReveal();

  if (!sessionResolved || user) {
    return (
      <div
        className="grid min-h-dvh place-items-center bg-background"
        role="status"
        aria-live="polite"
      >
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          <p className="text-sm text-muted-foreground">Loading SafePaws…</p>
        </div>
      </div>
    );
  }

  return <Landing />;
}

function Landing() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b border-border">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_15%_-10%,var(--color-primary-soft),transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="lp-drift pointer-events-none absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-success-soft/60 blur-3xl"
        />
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1.05fr_1fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="min-w-0">
            <Badge
              variant="secondary"
              className="lp-enter gap-1.5 rounded-full px-3 py-1 [animation-delay:60ms]"
            >
              <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
              Community rescue coordination
            </Badge>
            <h1 className="lp-enter mt-6 font-display text-[2.5rem] leading-[1.05] font-extrabold tracking-tight text-balance text-foreground [animation-delay:140ms] sm:text-5xl lg:text-6xl">
              Every stray deserves a
              <span className="text-primary"> fast response</span>.
            </h1>
            <p className="lp-enter mt-5 max-w-xl text-base leading-relaxed text-pretty text-muted-foreground [animation-delay:220ms] sm:text-lg">
              SafePaws connects the person who spots an animal in distress with the rescuers and
              organisations who can reach it — and keeps everyone informed until the animal is safe.
            </p>
            <div className="lp-enter mt-9 flex flex-col gap-3 [animation-delay:300ms] sm:flex-row">
              <Button asChild size="lg" className="group gap-2 transition-transform hover:-translate-y-0.5">
                <Link to="/register">
                  <Siren className="h-4.5 w-4.5" aria-hidden="true" />
                  Report an animal
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="group gap-2 transition-transform hover:-translate-y-0.5"
              >
                <Link to="/how-it-works">
                  How it works
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
              </Button>
            </div>
            <p className="lp-enter mt-5 text-sm text-muted-foreground [animation-delay:360ms]">
              Already part of the network?{" "}
              <Link
                to="/login"
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
              >
                Log in
              </Link>
            </p>
          </div>

          <div className="lp-enter-zoom relative [animation-delay:200ms]">
            <div className="group overflow-hidden rounded-3xl border border-border shadow-xl">
              <img
                src={heroImage}
                alt="A volunteer rescuer carefully lifting an injured street dog into a rescue van"
                width={1200}
                height={800}
                className="h-[280px] w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04] sm:h-[420px]"
                loading="eager"
                decoding="async"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Rescue journey */}
      <section
        aria-labelledby="journey-heading"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="lp-reveal max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">
            The rescue journey
          </p>
          <h2
            id="journey-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            From a sighting to a safe animal, in four steps
          </h2>
        </div>

        <ol className="relative mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-12 right-6 left-6 hidden border-t border-dashed border-border lg:block"
          />
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="lp-reveal card-surface group relative p-6 transition-shadow duration-300 hover:shadow-lg"
              style={{ "--lp-delay": `${i * 90}ms` } as React.CSSProperties}
            >
              <span className="relative grid h-11 w-11 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
                <step.icon className="h-5.5 w-5.5" aria-hidden="true" />
              </span>
              <span className="mt-5 block text-xs font-semibold tracking-wide text-muted-foreground">
                STEP {i + 1}
              </span>
              <h3 className="mt-1 font-display text-lg font-bold text-foreground">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Roles */}
      <section aria-labelledby="roles-heading" className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="lp-reveal max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-primary uppercase">
              Built for the whole chain
            </p>
            <h2
              id="roles-heading"
              className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl"
            >
              One platform, four coordinated roles
            </h2>
            <p className="mt-4 text-muted-foreground">
              Each role gets its own workspace, so a rescue never stalls between the person who
              reported it and the team responding.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            {audiences.map((a, i) => (
              <Card
                key={a.role}
                className="lp-reveal flex flex-col transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                style={{ "--lp-delay": `${i * 90}ms` } as React.CSSProperties}
              >
                <CardContent className="flex flex-1 flex-col p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success">
                    <a.icon className="h-5.5 w-5.5" aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 font-display text-lg font-bold text-foreground">{a.role}</h3>
                  <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="lp-reveal mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link to="/register">Create an account</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Coverage */}
      <section
        aria-labelledby="coverage-heading"
        className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24"
      >
        <div className="lp-reveal max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">Coverage</p>
          <h2
            id="coverage-heading"
            className="mt-3 font-display text-3xl font-bold tracking-tight text-balance text-foreground sm:text-4xl"
          >
            Built for the animals that share our streets
          </h2>
          <p className="mt-4 text-muted-foreground">
            Reports can be raised for any animal in distress, with severity, condition and location
            captured on the case.
          </p>
        </div>
        <ul className="mt-12 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {coverage.map((item, i) => (
            <li
              key={item.label}
              className="lp-reveal group relative overflow-hidden rounded-2xl border border-border"
              style={{ "--lp-delay": `${i * 80}ms` } as React.CSSProperties}
            >
              <img
                src={item.src}
                alt={item.alt}
                width={600}
                height={600}
                loading="lazy"
                decoding="async"
                className="h-40 w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105 sm:h-56"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-foreground/80 to-transparent p-4 text-sm font-semibold text-background">
                {item.label}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="lp-reveal rounded-3xl bg-primary px-6 py-14 text-center sm:px-12">
          <MapPin className="mx-auto h-8 w-8 text-primary-foreground" aria-hidden="true" />
          <h2 className="mx-auto mt-5 max-w-2xl font-display text-3xl font-bold tracking-tight text-balance text-primary-foreground sm:text-4xl">
            Spotted an animal in distress?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            Create an account to raise a report with a photo and location, then follow the response
            until the animal is safe.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="gap-2 transition-transform hover:-translate-y-0.5"
            >
              <Link to="/register">
                <Siren className="h-4.5 w-4.5" aria-hidden="true" />
                Report an animal
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            >
              <Link to="/contact">Contact the team</Link>
            </Button>
          </div>
        </div>
      </section>
    </PublicShell>
  );
}
