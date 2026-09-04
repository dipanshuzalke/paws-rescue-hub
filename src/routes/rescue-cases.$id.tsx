import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { ArrowLeft, Clock, Heart, MapPin, PawPrint, Phone, User } from "lucide-react";

import { PublicShell } from "@/components/layout/public-shell";
import { MapView } from "@/components/maps/map-view";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime, timeAgo } from "@/lib/format";
import { publicService } from "@/services/publicService";

export const Route = createFileRoute("/rescue-cases/$id")({
  loader: async ({ params }) => {
    try {
      return { report: await publicService.getRescueCase(params.id) };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.report.title ?? "Rescue case"} — ResQ Paws` },
      {
        name: "description",
        content: loaderData?.report.description ?? "Rescue case details on ResQ Paws.",
      },
      { property: "og:title", content: `${loaderData?.report.title ?? "Rescue case"} — ResQ Paws` },
      {
        property: "og:description",
        content: loaderData?.report.description ?? "Rescue case details on ResQ Paws.",
      },
    ],
  }),
  component: RescueCaseDetail,
});

function RescueCaseDetail() {
  const { report } = Route.useLoaderData();

  return (
    <PublicShell>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <Button asChild variant="ghost" className="-ml-3 mb-4 gap-1.5">
          <Link to="/rescue-cases">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            All rescue cases
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <PriorityBadge level={report.emergency} />
              <StatusBadge status={report.status} />
              <span className="text-xs font-medium text-muted-foreground">#{report.id}</span>
            </div>
            <h1 className="mt-3 font-display text-2xl font-bold text-foreground sm:text-3xl">
              {report.title}
            </h1>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {report.address}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-8">
            <div className="grid gap-3 sm:grid-cols-2">
              {(report.images.length ? report.images : ["/placeholder.svg"]).map((src: string, i: number) => (
                <div
                  key={`${src}-${i}`}
                  className="aspect-[4/3] overflow-hidden rounded-xl border border-border bg-muted"
                >
                  <img
                    src={src}
                    alt={`${report.condition} ${report.animal.toLowerCase()} photo ${i + 1}`}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                </div>
              ))}
            </div>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Description</h2>
                <p className="mt-2 text-sm text-muted-foreground">{report.description}</p>
                <dl className="mt-5 grid grid-cols-2 gap-4 border-t border-border pt-5 sm:grid-cols-4">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <PawPrint className="h-3.5 w-3.5" aria-hidden="true" />
                      {report.count} × {report.animal}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Condition</dt>
                    <dd className="mt-1 text-sm font-medium text-foreground">{report.condition}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Reported</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {timeAgo(report.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Rescuer</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-sm font-medium text-foreground">
                      <User className="h-3.5 w-3.5" aria-hidden="true" />
                      {report.rescuerName ?? "Not yet assigned"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Location</h2>
                <p className="mt-1 text-sm text-muted-foreground">{report.area}, {report.city}</p>
                <div className="mt-4">
                  <MapView
                    height="h-[280px]"
                    markers={[
                      {
                        id: report.id,
                        label: report.title,
                        sub: report.area,
                        coords: report.coords,
                        emergency: report.emergency,
                        kind: "request",
                      },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Status timeline</h2>
                <div className="mt-5">
                  <StatusTimeline entries={report.timeline} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h2 className="font-display text-lg font-bold text-foreground">Reported by</h2>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                  {report.reporterName}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(report.createdAt)}</p>
              </CardContent>
            </Card>

            <Card className="border-primary/25 bg-primary-soft/40">
              <CardContent className="flex flex-col items-center gap-3 p-6 text-center">
                <Heart className="h-6 w-6 text-primary" aria-hidden="true" />
                <p className="text-sm font-semibold text-foreground">Seen a similar case?</p>
                <p className="text-xs text-muted-foreground">
                  Report it so a nearby rescuer can respond just as quickly.
                </p>
                <Button asChild className="w-full">
                  <Link to="/citizen/report">Report an animal</Link>
                </Button>
                <Button asChild variant="outline" className="w-full gap-1.5">
                  <a href="tel:+917124567890">
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call rescue helpline
                  </a>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PublicShell>
  );
}
