import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
  RefreshCw,
  Send,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { MapView, type MapMarker } from "@/components/maps/map-view";
import { EvidenceSubmissionDialog } from "@/components/rescuer/evidence-submission-dialog";
import { NotesSection } from "@/components/shared/NotesSection";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { ReportImageGallery } from "@/components/shared/report-image-gallery";
import { Button } from "@/components/ui/button";

import {
  calculateDistanceKm,
  useLiveLocation,
} from "@/hooks/useLiveLocation";
import { useRescueTracking } from "@/hooks/useResqueTracking";

import { evidenceService } from "@/services/evidenceService";
import { formatDateTime, timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";

import type { RescueReport } from "@/types";

export const Route = createFileRoute("/rescuer/requests/$id")({
  head: () => ({
    meta: [
      {
        title: "Request Details · ResQ Paws",
      },
      {
        name: "description",
        content:
          "View rescue request details and manage the rescue lifecycle.",
      },
      {
        property: "og:title",
        content: "Request Details · ResQ Paws",
      },
      {
        property: "og:description",
        content:
          "View rescue request details and manage the rescue lifecycle.",
      },
    ],
  }),

  component: RescuerRequestDetail,
});

function RescuerRequestDetail() {
  const { id } = Route.useParams();

  const { reports, updateStatus, user } = useApp();

  const [evidenceOpen, setEvidenceOpen] = useState(false);

  /**
   * Local evidence state.
   *
   * This is important because directly doing:
   *
   * reports[index] = updated
   *
   * does not reliably trigger a React re-render.
   *
   * After submitting/resubmitting evidence, we immediately
   * store the returned evidence here.
   */
  const [evidenceOverride, setEvidenceOverride] = useState<
    RescueReport["evidence"] | null
  >(null);

  /**
   * Find current report from global store.
   */
  const report = useMemo(
    () => reports.find((item) => item.id === id),
    [reports, id],
  );

  /**
   * Reset page-level evidence override when navigating
   * from one request to another.
   */
  useEffect(() => {
    setEvidenceOverride(null);
  }, [id]);

  /**
   * ---------------------------------------------------------
   * Evidence
   * ---------------------------------------------------------
   *
   * Backend:
   * report.rescueEvidence
   *
   * Frontend adapter:
   * report.evidence
   */
  const evidence =
    evidenceOverride ?? report?.evidence ?? null;

  const evidenceStatus =
    evidence?.verificationStatus ?? null;

  /**
   * Check whether this rescue belongs to the logged-in rescuer.
   */
  const isMine =
    report?.rescuerId === user?.id;

  /**
   * ---------------------------------------------------------
   * Refresh evidence from backend
   * ---------------------------------------------------------
   *
   * This handles an important case:
   *
   * Rescuer submits evidence
   *        ↓
   * PENDING
   *        ↓
   * NGO rejects it
   *        ↓
   * Rescuer is still on this page
   *
   * We periodically fetch the latest evidence so the
   * REJECTED state can appear without requiring a manual
   * browser refresh.
   */
  useEffect(() => {
    if (!report?.id || !isMine) return;

    let cancelled = false;

    const refreshEvidence = async () => {
      try {
        const latestReport =
          await evidenceService.getEvidence(report.id);

        if (cancelled) return;

        if (latestReport?.evidence) {
          setEvidenceOverride(latestReport.evidence);
        }
      } catch {
        // Do not show an error toast for background refreshes.
        // The normal page/API errors are handled elsewhere.
      }
    };

    /**
     * Fetch once when page loads.
     */
    refreshEvidence();

    /**
     * Then periodically check for NGO/Admin verification
     * changes while the case is still active.
     */
    const interval = window.setInterval(() => {
      refreshEvidence();
    }, 5000);

    /**
     * Also refresh when the user returns to the tab.
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refreshEvidence();
      }
    };

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      cancelled = true;
      window.clearInterval(interval);

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [report?.id, isMine]);

  /**
   * ---------------------------------------------------------
   * Tracking state
   * ---------------------------------------------------------
   *
   * GPS tracking is active only when:
   *
   * IN_PROGRESS + no evidence submitted yet
   *
   * Once evidence is submitted:
   *
   * PENDING  → tracking stopped
   * REJECTED → tracking stopped
   * VERIFIED → tracking stopped
   */
  const isDriving =
    report?.status === "IN_PROGRESS" &&
    !evidenceStatus;

  /**
   * Current rescuer GPS location.
   */
  const {
    location: rescuerLocation,
    error: gpsError,
  } = useLiveLocation(isDriving);

  /**
   * Distance between rescuer and reported animal.
   */
  const liveDistanceKm = rescuerLocation
    ? calculateDistanceKm(
        rescuerLocation,
        report?.coords ?? {
          lat: 0,
          lng: 0,
        },
      )
    : null;

  /**
   * Send live location through Socket.IO.
   */
  useRescueTracking(
    report?.id,
    isDriving,
    rescuerLocation,
  );

  /**
   * ---------------------------------------------------------
   * Evidence submission success
   * ---------------------------------------------------------
   *
   * IMPORTANT:
   * Do NOT mutate reports[index].
   *
   * Instead update local evidence state so React immediately
   * changes the UI.
   */
  const handleEvidenceSuccess = (
    updated: RescueReport | undefined,
  ) => {
    if (!updated) return;

    /**
     * Immediately update evidence shown on this page.
     */
    setEvidenceOverride(updated.evidence ?? null);

    /**
     * Close dialog.
     */
    setEvidenceOpen(false);

    /**
     * Show correct message.
     */
    if (
      updated.evidence?.verificationStatus ===
      "PENDING"
    ) {
      toast.success(
        "Evidence submitted. Waiting for NGO/Admin verification.",
      );
    } else {
      toast.success(
        "Evidence submitted successfully.",
      );
    }
  };

  /**
   * ---------------------------------------------------------
   * Request not found
   * ---------------------------------------------------------
   */
  if (!report) {
    return (
      <div className="space-y-4">
        <Link
          to="/rescuer/requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
          Back to requests
        </Link>

        <EmptyState
          title="Request not found"
          description="This request may have been closed."
        />
      </div>
    );
  }

  /**
   * ---------------------------------------------------------
   * Map marker
   * ---------------------------------------------------------
   */
  const markers: MapMarker[] = [
    {
      id: report.id,
      label: report.title,
      sub: report.area,
      coords: report.coords,
      emergency: report.emergency,
      kind: "request",
    },
  ];

  /**
   * ---------------------------------------------------------
   * Accept request
   * ---------------------------------------------------------
   */
  const handleAccept = () => {
    if (!isMine) return;

    updateStatus(
      report.id,
      "ACCEPTED",
      `Accepted by ${user?.name ?? "rescuer"}.`,
    );

    toast.success("Request accepted.");
  };

  /**
   * ---------------------------------------------------------
   * Start rescue
   * ---------------------------------------------------------
   */
  const handleStartDriving = () => {
    if (!isMine) return;

    updateStatus(
      report.id,
      "IN_PROGRESS",
      `${user?.name ?? "Rescuer"} is on the way.`,
    );

    toast.success(
      "Rescue started. Live location tracking is active.",
    );
  };

  /**
   * ---------------------------------------------------------
   * Open Google Maps
   * ---------------------------------------------------------
   */
  const handleOpenGoogleMaps = () => {
    const { lat, lng } = report.coords;

    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${lat},${lng}` +
      `&travelmode=driving`;

    window.open(
      googleMapsUrl,
      "_blank",
      "noopener,noreferrer",
    );
  };

  return (
    <div className="space-y-6">
      {/* =====================================================
          BACK
      ====================================================== */}
      <Link
        to="/rescuer/active"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft
          className="h-4 w-4"
          aria-hidden="true"
        />
        Back to requests
      </Link>

      {/* =====================================================
          PAGE HEADER
      ====================================================== */}
      <PageHeader
        title={report.title}
        description={`#${report.id} · Reported ${timeAgo(
          report.createdAt,
        )}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PriorityBadge level={report.emergency} />

            <StatusBadge status={report.status} />
          </div>
        }
      />

      {/* =====================================================
          MAIN CONTENT
      ====================================================== */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ===================================================
            LEFT COLUMN
        ==================================================== */}
        <div className="space-y-6 lg:col-span-2">
          {/* Report images */}
          <section className="card-surface p-4">
            <ReportImageGallery
              images={report.images}
              alt={`${report.condition} ${report.animal.toLowerCase()} photo`}
            />
          </section>

          {/* Description */}
          <section className="card-surface p-4">
            <SectionHeading title="Description" />

            <p className="text-sm text-foreground/90">
              {report.description}
            </p>

            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">
                  Animal
                </dt>

                <dd className="font-medium text-foreground">
                  {report.animal}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Count
                </dt>

                <dd className="font-medium text-foreground">
                  {report.count}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Condition
                </dt>

                <dd className="font-medium text-foreground">
                  {report.condition}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-muted-foreground">
                  Reported
                </dt>

                <dd className="font-medium text-foreground">
                  {formatDateTime(report.createdAt)}
                </dd>
              </div>
            </dl>
          </section>

          {/* =================================================
              LOCATION & ROUTE
          ================================================== */}
          <section className="card-surface p-4">
            <SectionHeading
              title="Location & route"
              description={
                isDriving &&
                liveDistanceKm !== null
                  ? `${liveDistanceKm.toFixed(
                      1,
                    )} km away · ETA ${Math.max(
                      3,
                      Math.round(
                        liveDistanceKm * 4,
                      ),
                    )} min`
                  : evidenceStatus ===
                    "PENDING"
                    ? "Evidence submitted — waiting for verification."
                    : evidenceStatus ===
                      "REJECTED"
                      ? "Evidence rejected — review the feedback and submit another evidence."
                      : evidenceStatus ===
                        "VERIFIED"
                        ? "Evidence verified — rescue completion is being processed."
                        : "Getting your location..."
              }
            />

            <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin
                className="h-4 w-4 shrink-0"
                aria-hidden="true"
              />

              {report.address}, {report.area},{" "}
              {report.city}
            </p>

            <MapView
              markers={markers}
              height="h-[320px]"
              tracking={isDriving}
              liveLocation={rescuerLocation}
              locationError={gpsError}
              showStartDriving={
                isMine &&
                report.status === "ACCEPTED"
              }
              onStartDriving={handleStartDriving}
              showNavigation={isDriving}
            />
          </section>

          {/* =================================================
              EVIDENCE STATUS
          ================================================== */}
          {isMine && evidenceStatus ? (
            <section className="card-surface p-4">
              <SectionHeading
                title="Rescue evidence"
                description="Track the verification status of your submitted evidence."
              />

              {/* =================================================
                  PENDING
              ================================================== */}
              {evidenceStatus === "PENDING" && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary-soft p-4">
                  <div className="flex items-start gap-3">
                    <RefreshCw
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        Evidence verification pending
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Your rescue evidence has been
                        submitted successfully. Please
                        wait while the NGO/Admin reviews
                        your evidence.
                      </p>

                      {evidence?.submissionCount ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Submission #
                          {evidence.submissionCount}
                        </p>
                      ) : null}

                      <div className="mt-3 rounded-md border border-primary/10 bg-background/60 p-3">
                        <p className="text-xs font-medium text-muted-foreground">
                          Current status
                        </p>

                        <p className="mt-1 text-sm font-semibold text-primary">
                          Waiting for NGO/Admin
                          verification
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  REJECTED
              ================================================== */}
              {evidenceStatus === "REJECTED" && (
                <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div className="flex items-start gap-3">
                    <XCircle
                      className="mt-0.5 h-5 w-5 shrink-0 text-destructive"
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-destructive">
                        Evidence rejected
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        The NGO/Admin has rejected
                        your submitted evidence.
                        Please review the feedback
                        and submit another evidence.
                      </p>

                      {evidence?.rejectionReason?.trim() ? (
                        <div className="mt-3 rounded-md border border-destructive/20 bg-background p-3">
                          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            NGO/Admin feedback
                          </p>

                          <p className="mt-1 text-sm text-foreground">
                            {evidence.rejectionReason}
                          </p>
                        </div>
                      ) : null}

                      {evidence?.submissionCount ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Previous submission #
                          {evidence.submissionCount}
                        </p>
                      ) : null}

                      <div className="mt-4">
                        <Button
                          onClick={() =>
                            setEvidenceOpen(true)
                          }
                        >
                          <Send
                            className="mr-2 h-4 w-4"
                            aria-hidden="true"
                          />
                          Submit Another Evidence
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  VERIFIED
              ================================================== */}
              {evidenceStatus === "VERIFIED" && (
                <div className="mt-4 rounded-lg border border-primary/20 bg-primary-soft p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle2
                      className="mt-0.5 h-5 w-5 shrink-0 text-primary"
                      aria-hidden="true"
                    />

                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">
                        Evidence verified
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        Your rescue evidence has been
                        verified by the NGO/Admin. The
                        rescue has been approved for
                        completion.
                      </p>

                      {evidence?.submissionCount ? (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Final submission #
                          {evidence.submissionCount}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )}
            </section>
          ) : null}

          {/* =================================================
              STATUS TIMELINE
          ================================================== */}
          <section className="card-surface p-4">
            <SectionHeading title="Status timeline" />

            <StatusTimeline
              entries={report.timeline}
            />
          </section>
        </div>

        {/* ===================================================
            RIGHT COLUMN
        ==================================================== */}
        <div className="space-y-6">
          {/* Reporter contact */}
          <section className="card-surface p-4">
            <SectionHeading title="Reporter contact" />

            <p className="font-semibold text-foreground">
              {report.reporterName}
            </p>

            <p className="text-sm text-muted-foreground">
              {report.reporterPhone}
            </p>

            <div className="mt-3 flex gap-2">
              {/* Call */}
              <Button
                variant="outline"
                className="flex-1"
                asChild
              >
                <a
                  href={`tel:${report.reporterPhone}`}
                >
                  <Phone
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Call
                </a>
              </Button>

              {/* Message */}
              <Button
                variant="outline"
                className="flex-1"
                asChild
                disabled={!report.reporterPhone}
              >
                <a
                  href={`sms:${
                    report.reporterPhone
                  }?body=${encodeURIComponent(
                    `Hello ${
                      report.reporterName
                    }, this is ${
                      user?.name ?? "your rescuer"
                    } from ResQ Paws regarding report #${
                      report.id
                    }.`,
                  )}`}
                >
                  <MessageCircle
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Message
                </a>
              </Button>
            </div>
          </section>

          {/* =================================================
              ACTIONS
          ================================================== */}
          <section className="card-surface p-4">
            <SectionHeading
              title="Actions"
              description="Manage your assigned rescue."
            />

            <div className="mt-4 flex flex-col gap-2">
              {/* =================================================
                  ACCEPT
              ================================================== */}
              {isMine &&
              (report.status === "REPORTED" ||
                report.status === "ASSIGNED") ? (
                <Button onClick={handleAccept}>
                  Accept request
                </Button>
              ) : null}

              {/* =================================================
                  START RESCUE
              ================================================== */}
              {isMine &&
              report.status === "ACCEPTED" ? (
                <Button
                  onClick={handleStartDriving}
                >
                  <Navigation
                    className="mr-2 h-4 w-4"
                    aria-hidden="true"
                  />
                  Start rescue
                </Button>
              ) : null}

              {/* =================================================
                  IN PROGRESS
              ================================================== */}
              {isMine &&
              report.status === "IN_PROGRESS" ? (
                <>
                  {/* ---------------------------------------------
                      NO EVIDENCE YET
                  ---------------------------------------------- */}
                  {!evidenceStatus && (
                    <Button
                      onClick={() =>
                        setEvidenceOpen(true)
                      }
                    >
                      <Send
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Submit Rescue Evidence
                    </Button>
                  )}

                  {/* ---------------------------------------------
                      PENDING
                  ---------------------------------------------- */}
                  {evidenceStatus === "PENDING" && (
                    <div className="rounded-lg border border-primary/20 bg-primary-soft p-3">
                      <div className="flex items-start gap-2">
                        <RefreshCw
                          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                          aria-hidden="true"
                        />

                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            Evidence under review
                          </p>

                          <p className="mt-1 text-xs text-muted-foreground">
                            Your evidence has been
                            submitted. Wait for
                            NGO/Admin verification.
                          </p>

                          {evidence?.submissionCount ? (
                            <p className="mt-2 text-xs text-muted-foreground">
                              Submission #
                              {
                                evidence.submissionCount
                              }
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ---------------------------------------------
                      REJECTED
                  ---------------------------------------------- */}
                  {evidenceStatus === "REJECTED" && (
                    <Button
                      onClick={() =>
                        setEvidenceOpen(true)
                      }
                    >
                      <Send
                        className="mr-2 h-4 w-4"
                        aria-hidden="true"
                      />
                      Submit Another Evidence
                    </Button>
                  )}

                  {/* ---------------------------------------------
                      GOOGLE MAPS
                  ---------------------------------------------- */}
                  <Button
                    variant="outline"
                    onClick={handleOpenGoogleMaps}
                  >
                    <Navigation
                      className="mr-2 h-4 w-4"
                      aria-hidden="true"
                    />
                    Open in Google Maps
                  </Button>
                </>
              ) : null}

              {/* =================================================
                  COMPLETED
              ================================================== */}
              {(report.status === "RESCUED" ||
                report.status === "CLOSED") && (
                <div className="rounded-lg border border-primary/20 bg-primary-soft p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2
                      className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                      aria-hidden="true"
                    />

                    <div>
                      <p className="text-sm font-semibold text-foreground">
                        Rescue completed
                      </p>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Your evidence was verified and
                        the rescue has been completed.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* =================================================
                  ANOTHER RESCUER
              ================================================== */}
              {!isMine &&
              report.status !== "REPORTED" &&
              report.status !== "ASSIGNED" ? (
                <p className="text-sm text-muted-foreground">
                  Assigned to{" "}
                  {report.rescuerName ??
                    "another rescuer"}
                  .
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* =====================================================
          NOTES
      ====================================================== */}
      <NotesSection notes={report.notes} />

      {/* =====================================================
          EVIDENCE SUBMISSION DIALOG
      ====================================================== */}
      {report ? (
        <EvidenceSubmissionDialog
          open={evidenceOpen}
          onOpenChange={setEvidenceOpen}
          report={report}
          onSuccess={handleEvidenceSuccess}
        />
      ) : null}
    </div>
  );
}