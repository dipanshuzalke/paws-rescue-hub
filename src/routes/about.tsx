import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Award, Heart, MapPin, PawPrint, Target, Users } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { mockNGOs } from "@/data/mockNGOs";
import { initials } from "@/lib/format";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — ResQ Paws" },
      {
        name: "description",
        content:
          "ResQ Paws is a coordination platform connecting citizens, rescuers and NGOs across Nagpur to give every stray animal a fast, tracked response.",
      },
      { property: "og:title", content: "About Us — ResQ Paws" },
      {
        property: "og:description",
        content: "Our mission, impact and the NGOs powering the ResQ Paws rescue network.",
      },
    ],
  }),
  component: About,
});

const stats = [
  { value: "2,480+", label: "Rescues coordinated" },
  { value: "18 min", label: "Median response time" },
  { value: "340", label: "Verified rescuers" },
  { value: "26", label: "Partner NGOs" },
];

const values = [
  {
    icon: Target,
    title: "Speed over paperwork",
    body: "Every extra minute costs an animal its safety. Our workflows are built to be filled in seconds, not forms.",
  },
  {
    icon: Users,
    title: "Community-powered",
    body: "Rescues happen because a citizen cared enough to stop and report. We make it effortless to act.",
  },
  {
    icon: Heart,
    title: "Transparent outcomes",
    body: "Every reporter deserves to know what happened to the animal they cared about — so we track it end to end.",
  },
];

const team = [
  { name: "Ananya Deshpande", role: "Founder & Program Lead", org: "ResQ Paws" },
  { name: "Rohit Kale", role: "Field Operations", org: "ResQ Paws" },
  { name: "Dr. Neha Sane", role: "Veterinary Advisor", org: "ResQ Paws" },
  { name: "Sameer Joshi", role: "Partnerships", org: "ResQ Paws" },
];

function About() {
  return (
    <PublicShell>
      <section className="border-b border-border bg-primary-soft/40">
        <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-24">
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1">
            <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
            Our mission
          </Badge>
          <h1 className="mt-5 font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Every stray animal deserves someone who shows up
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            ResQ Paws exists to close the gap between a person who spots an animal in distress and the
            rescuer who can reach it — coordinated in real time, tracked to a real outcome.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <dl className="grid grid-cols-2 gap-6 rounded-2xl border border-border bg-card p-8 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <dt className="sr-only">{s.label}</dt>
              <dd>
                <span className="block font-display text-3xl font-bold text-foreground">{s.value}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{s.label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">What drives us</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our values
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-3">
          {values.map((v) => (
            <Card key={v.title}>
              <CardContent className="p-6">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-success-soft text-success">
                  <v.icon className="h-5.5 w-5.5" aria-hidden="true" />
                </span>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold tracking-wide text-primary uppercase">Our network</p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Partner NGOs across Nagpur
              </h2>
            </div>
            <Button asChild variant="outline" className="gap-1.5">
              <Link to="/register">
                Partner with us
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {mockNGOs.map((ngo) => (
              <Card key={ngo.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <Award className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <UserStatusBadge status={ngo.status} />
                  </div>
                  <h3 className="mt-4 font-display text-base font-bold text-foreground">{ngo.name}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {ngo.location}
                  </p>
                  <p className="mt-3 line-clamp-3 text-sm text-muted-foreground">{ngo.about}</p>
                  <div className="mt-4 flex gap-4 border-t border-border pt-4 text-xs text-muted-foreground">
                    <span>
                      <span className="font-semibold text-foreground">{ngo.rescuers}</span> rescuers
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">{ngo.cases}</span> cases handled
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold tracking-wide text-primary uppercase">The people behind it</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our team
          </h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {team.map((member) => (
            <Card key={member.name}>
              <CardContent className="flex flex-col items-center p-6 text-center">
                <span className="grid h-16 w-16 place-items-center rounded-full bg-primary-soft text-lg font-bold text-primary">
                  {initials(member.name)}
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">{member.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{member.role}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </PublicShell>
  );
}
