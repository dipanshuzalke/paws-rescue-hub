import { Link, createFileRoute } from "@tanstack/react-router";
import {
  Loader2,
  Phone,
  MessageSquare,
  Send,
  XCircle,
  Clock3,
  MapPin,
  Radio,
  Navigation,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MapView } from "@/components/maps/map-view";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ReportImageGallery } from "@/components/shared/report-image-gallery";
import { formatDateTime, initials, timeAgo } from "@/lib/format";
import { apiErrorMessage } from "@/lib/api-client";
import { useApp } from "@/store/app-store";

import { useRescueLiveLocation } from "@/hooks/useRescueLiveLocation";

export const Route = createFileRoute("/citizen/reports/$id")({
  head: ({ params }) => ({
    meta: [
      {
        title: `Report ${params.id} · ResQ Paws`,
      },
      {
        name: "description",
        content: "Track the status of your rescue report in real time.",
      },
      {
        property: "og:title",
        content: `Report ${params.id} · ResQ Paws`,
      },
      {
        property: "og:description",
        content: "Track the status of your rescue report in real time.",
      },
    ],
  }),
  component: CitizenReportDetail,
});

/**
 * Calculate straight-line distance between two coordinates.
 * Returns distance in kilometres.
 */
function calculateDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;

  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function CitizenReportDetail() {
  const { id } = Route.useParams();

  const { reports, addNote, cancelReport, loading, authReady } = useApp();

  const report = reports.find((r) => r.id === id);

  /**
   * Live rescuer tracking
   */
  const {
    rescuerLocation: remoteRescuerLocation,
    rescuerName,
    tracking: remoteTracking,
  } = useRescueLiveLocation(report?.id);

  const [note, setNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);

  const [lastLocationUpdate, setLastLocationUpdate] = useState<Date | null>(null);

  /**
   * Update last GPS update time whenever
   * a new location is received.
   */
  useEffect(() => {
    if (remoteRescuerLocation) {
      setLastLocationUpdate(new Date());
    }
  }, [remoteRescuerLocation]);

  /**
   * Safely extract GPS heading.
   */
  const rescuerHeading = remoteRescuerLocation?.heading ?? null;

  /**
   * Convert heading degrees to human-readable direction.
   */
  const directionText = useMemo(() => {
    if (rescuerHeading === null) {
      return "Direction unavailable";
    }

    const directions = [
      "North",
      "North-East",
      "East",
      "South-East",
      "South",
      "South-West",
      "West",
      "North-West",
    ];

    return directions[Math.round(rescuerHeading / 45) % 8];
  }, [rescuerHeading]);

  /**
   * Calculate straight-line distance between
   * the animal and the rescuer.
   */
  const distanceToRescuer = useMemo(() => {
    if (!remoteRescuerLocation || !report) {
      return null;
    }

    return calculateDistanceKm(
      report.coords.lat,
      report.coords.lng,
      remoteRescuerLocation.lat,
      remoteRescuerLocation.lng,
    );
  }, [remoteRescuerLocation, report]);

  if (!authReady || loading) {
    return (
      <div className="card-surface flex min-h-48 items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Loading report" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="card-surface p-8 text-center">
        <p className="text-base font-semibold text-foreground">Report not found</p>

        <p className="mt-1 text-sm text-muted-foreground">
          This rescue report may have been removed.
        </p>

        <Button asChild className="mt-4">
          <Link to="/citizen/reports">Back to my reports</Link>
        </Button>
      </div>
    );
  }

  /**
   * Owner can cancel only before rescue work starts.
   */
  const canCancel = ["REPORTED", "ASSIGNED", "ACCEPTED"].includes(report.status);

  /**
   * Add note.
   */
  const handleAddNote = () => {
    if (!note.trim()) return;

    addNote(report.id, note.trim());
    setNote("");

    toast.success("Note added");
  };

  /**
   * Cancel report.
   */
  const handleCancel = async () => {
    try {
      await cancelReport(report.id, "Cancelled by reporter.");

      setCancelOpen(false);

      toast.success("Report cancelled");
    } catch (err) {
      toast.error(apiErrorMessage(err));
    }
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            #{report.id}
          </p>

          <h1 className="font-display text-2xl font-bold text-foreground">{report.title}</h1>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} awaitingAcceptance />

            <PriorityBadge level={report.emergency} />

            <span className="text-xs text-muted-foreground">
              Reported {timeAgo(report.createdAt)}
            </span>
          </div>
        </div>

        {canCancel ? (
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setCancelOpen(true)}
          >
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancel report
          </Button>
        ) : null}
      </div>

      {/* =====================================================
          MAIN LAYOUT
      ===================================================== */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* ===================================================
            LEFT SIDE
        =================================================== */}
        <div className="space-y-6 xl:col-span-2">
          {/* Report images */}
          {report.images.length > 0 ? (
            <div className="card-surface p-3">
              <ReportImageGallery
                images={report.images}
                alt={`${report.condition} ${report.animal} in ${report.area}`}
              />
            </div>
          ) : null}

          {/* Report details */}
          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Details</h2>

            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>

                <dd className="text-sm text-foreground">
                  {report.count} × {report.animal}
                </dd>
              </div>

              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Condition</dt>

                <dd className="text-sm text-foreground">{report.condition}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Location</dt>

                <dd className="text-sm text-foreground">
                  {report.address}, {report.area}, {report.city}
                </dd>
              </div>

              {report.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">
                    Description
                  </dt>

                  <dd className="text-sm text-foreground">{report.description}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          {/* Status timeline */}
          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Status timeline</h2>

            <div className="mt-4">
              <StatusTimeline entries={report.timeline} />
            </div>
          </div>

          {/* Notes */}
          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Notes</h2>

            <div className="mt-3 space-y-3">
              {report.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                report.notes.map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(n.author)}</AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1 rounded-lg bg-muted/50 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-foreground">{n.author}</p>

                        <p className="text-xs text-muted-foreground">{formatDateTime(n.at)}</p>
                      </div>

                      <p className="mt-1 text-sm text-foreground">{n.text}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex items-start gap-2">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the rescue team..."
                rows={2}
              />

              <Button onClick={handleAddNote} aria-label="Send note">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* ===================================================
            RIGHT SIDE
        =================================================== */}
        <div className="space-y-6">
          {/* Assigned rescuer */}
          {report.rescuerName ? (
            <div className="card-surface p-5">
              <h2 className="font-display text-lg font-bold text-foreground">Assigned rescuer</h2>

              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-11 w-11">
                  <AvatarFallback>{initials(report.rescuerName)}</AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {report.rescuerName}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {report.ngoName ?? "Independent rescuer"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                  disabled={!report.rescuerPhone}
                >
                  <a href={`tel:${report.rescuerPhone}`}>
                    <Phone className="h-4 w-4" aria-hidden="true" />
                    Call
                  </a>
                </Button>

                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                  disabled={!report.rescuerPhone}
                >
                  <a
                    href={`sms:${report.rescuerPhone}?body=${encodeURIComponent(
                      `Hello ${report.rescuerName}, I am following up on my ResQ Paws report #${report.id}.`,
                    )}`}
                  >
                    <MessageSquare className="h-4 w-4" aria-hidden="true" />
                    Message
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div className="card-surface p-5">
              <h2 className="font-display text-lg font-bold text-foreground">Assigned rescuer</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                No rescuer assigned yet. We&apos;ll notify you as soon as one accepts this case.
              </p>
            </div>
          )}

          {/* =================================================
              LIVE RESCUE TRACKING
          ================================================= */}
          <div className="card-surface overflow-hidden p-3">
            {/* ===============================================
                TRACKING ACTIVE
            =============================================== */}
            {remoteTracking && remoteRescuerLocation ? (
              <div className="mt-4 space-y-3">
                {/* Rescuer status */}
                <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                      <Radio className="h-5 w-5 text-green-600" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-foreground">
                        {rescuerName ?? report.rescuerName ?? "Rescuer"} is on the way
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Live GPS location is being shared with you.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* =============================================
                 WAITING FOR TRACKING
              ============================================= */
              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-muted-foreground/40" />

                  <div>
                    <p className="text-sm font-semibold text-foreground">Waiting for rescuer</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Live tracking will appear here when the rescuer starts driving.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* =================================================
                MAP
            ================================================= */}
            <div className="mt-3 overflow-hidden rounded-xl border border-border">
              <MapView
                height="h-[320px]"
                markers={[
                  {
                    id: report.id,
                    label: report.title,
                    sub: `${report.area} · Animal location`,
                    coords: report.coords,
                    emergency: report.emergency,
                    kind: "request",
                  },
                ]}
                remoteRescuerLocation={remoteRescuerLocation}
              />
            </div>
          </div>
        </div>
      </div>

      {/* =====================================================
          CANCEL DIALOG
      ===================================================== */}
      <ConfirmDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        title="Cancel this report?"
        description="This will mark the rescue request as cancelled. This action cannot be undone."
        confirmLabel="Cancel report"
        destructive
        onConfirm={handleCancel}
      />
    </div>
  );
}
