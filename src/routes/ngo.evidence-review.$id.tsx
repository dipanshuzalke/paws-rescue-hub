import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState, ErrorState } from "@/components/shared/states";
import { ReportImageGallery } from "@/components/shared/report-image-gallery";
import { DuplicateComparisonPanel } from "@/components/ngo/duplicate-comparison-panel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAsync } from "@/hooks/use-async";
import { formatDateTime, timeAgo } from "@/lib/format";
import { evidenceService } from "@/services/evidenceService";
import { duplicateService } from "@/services/duplicateService";
import { useApp } from "@/store/app-store";
import type { DuplicateMatch, RescueReport } from "@/types";

export const Route = createFileRoute("/ngo/evidence-review/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Evidence Review ${params.id} · ResQ Paws` },
      { name: "description", content: "Review and verify rescue evidence." },
      { property: "og:title", content: `Evidence Review ${params.id} · ResQ Paws` },
      {
        property: "og:description",
        content: "Review and verify rescue evidence submitted by rescuers.",
      },
    ],
  }),
  component: NgoPendingEvidenceReview,
});

function NgoPendingEvidenceReview() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { reports, apiMode } = useApp();
  const storeReport = useMemo(() => reports.find((r) => r.id === id), [reports, id]);

  const {
    data: fetchedReport,
    loading,
    error,
    retry,
  } = useAsync<RescueReport>(
    () => {
      if (!apiMode && storeReport) return Promise.resolve(storeReport);
      return evidenceService.getEvidence(id);
    },
    [id, apiMode, storeReport],
  );

  const report = fetchedReport ?? storeReport ?? null;

  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [verifyNotes, setVerifyNotes] = useState("");
  const [rescuerRating, setRescuerRating] = useState("5");
  const [rejectReason, setRejectReason] = useState("");
  const [processing, setProcessing] = useState(false);

  // Load duplicate matches when report loads
  useEffect(() => {
    if (!report) return;

    const loadDuplicates = async () => {
      setLoadingDuplicates(true);
      try {
        const result = await duplicateService.forReport(report.id);
        setDuplicates(result.matches);
      } catch {
        // Fail silently, duplicates are optional
      } finally {
        setLoadingDuplicates(false);
      }
    };

    loadDuplicates();
  }, [report]);

  if (loading) {
    return (
      <div className="space-y-4">
        <Link
          to="/ngo/pending-verification"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to pending
        </Link>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-label="Loading case..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link
          to="/ngo/pending-verification"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to pending
        </Link>
        <ErrorState description="Could not load this case for review." onRetry={retry} />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="space-y-4">
        <Link
          to="/ngo/pending-verification"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to pending
        </Link>
        <EmptyState title="Case not found" description="This case may have been removed or archived." />
      </div>
    );
  }

  const evidence = report.evidence;

  const handleVerify = async () => {
    setProcessing(true);
    try {
      await evidenceService.verify(report.id, verifyNotes, true, Number(rescuerRating));
      toast.success("Evidence verified and rescue closed");
      navigate({ to: "/ngo/pending-verification" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to verify evidence");
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }

    setProcessing(true);
    try {
      const updated = await evidenceService.reject(report.id, rejectReason);
      toast.success("Evidence rejected. Rescuer notified to resubmit.");
      navigate({ to: "/ngo/pending-verification" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to reject evidence");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Link
        to="/ngo/pending-verification"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to pending
      </Link>

      <PageHeader
        title={`Evidence Review: ${report.title}`}
        description={`#${report.id} · Rescue on ${timeAgo(report.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PriorityBadge level={report.emergency} />
            <StatusBadge status={report.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Original Rescue Photos */}
          <section className="card-surface p-4">
            <SectionHeading title="Original animal photos" />
            {report.images.length > 0 ? (
              <ReportImageGallery
                images={report.images}
                alt={`${report.condition} ${report.animal} photo`}
              />
            ) : (
              <p className="text-sm text-muted-foreground">No photos in original report</p>
            )}
          </section>

          {/* Evidence Submission */}
          {evidence ? (
            <>
              <section className="card-surface p-4">
                <SectionHeading title="Rescue evidence photos" />
                {evidence.photos.length > 0 ? (
                  <ReportImageGallery
                    images={evidence.photos}
                    alt="Evidence photo"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">No evidence photos submitted</p>
                )}
              </section>

              <section className="card-surface p-4">
                <SectionHeading title="Evidence details" />
                <dl className="space-y-3 text-sm">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Submitted by</dt>
                    <dd className="text-foreground">{evidence.submittedByName}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Submitted at</dt>
                    <dd className="text-foreground">
                      {evidence.submittedAt ? formatDateTime(evidence.submittedAt) : "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-muted-foreground">Submission count</dt>
                    <dd className="text-foreground">{evidence.submissionCount}</dd>
                  </div>
                  {evidence.animalCondition && (
                    <div>
                      <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal condition</dt>
                      <dd className="text-foreground">{evidence.animalCondition}</dd>
                    </div>
                  )}
                  {evidence.treatmentNotes && (
                    <div>
                      <dt className="text-xs font-semibold uppercase text-muted-foreground">Treatment provided</dt>
                      <dd className="text-foreground whitespace-pre-wrap">{evidence.treatmentNotes}</dd>
                    </div>
                  )}
                </dl>
              </section>

              <section className="card-surface p-4">
                <SectionHeading title="Rescue notes" />
                <p className="text-sm text-foreground whitespace-pre-wrap">{evidence.notes}</p>
              </section>

              {evidence.rejectionReason && (
                <section className="card-surface p-4 border-destructive/30 bg-destructive/5">
                  <div className="flex gap-2">
                    <XCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <SectionHeading title="Rejection reason" />
                      <p className="text-sm text-foreground">{evidence.rejectionReason}</p>
                    </div>
                  </div>
                </section>
              )}
            </>
          ) : (
            <section className="card-surface p-4 border-warning/30 bg-warning/5">
              <div className="flex gap-2">
                <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <p className="text-sm font-medium text-foreground">No evidence submitted yet</p>
                  <p className="text-xs text-muted-foreground mt-1">Waiting for rescuer to submit photos and details.</p>
                </div>
              </div>
            </section>
          )}

          {/* Case Details */}
          <section className="card-surface p-4">
            <SectionHeading title="Rescue details" />
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>
                <dd className="text-foreground">{report.count} × {report.animal}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Condition</dt>
                <dd className="text-foreground">{report.condition}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Location</dt>
                <dd className="text-foreground">{report.address}, {report.area}, {report.city}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Reporter description</dt>
                <dd className="text-foreground whitespace-pre-wrap">{report.description}</dd>
              </div>
            </dl>
          </section>

          {/* Duplicate Comparison */}
          {loadingDuplicates ? (
            <section className="card-surface p-4">
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" aria-label="Loading duplicates..." />
              </div>
            </section>
          ) : duplicates.length > 0 ? (
            <DuplicateComparisonPanel
              report={report}
              matches={duplicates}
              onDuplicateLinked={() => {
                // Refresh or navigate after linking
                navigate({ to: "/ngo/pending-verification" });
              }}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <section className="card-surface p-4">
            <SectionHeading title="Verification status" />
            <div className="space-y-3">
              {evidence?.status === "VERIFIED" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10">
                  <CheckCircle2 className="h-5 w-5 text-success" aria-hidden="true" />
                  <span className="font-medium text-success">Evidence Verified</span>
                </div>
              ) : evidence?.status === "REJECTED" ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10">
                  <XCircle className="h-5 w-5 text-destructive" aria-hidden="true" />
                  <span className="font-medium text-destructive">Evidence Rejected</span>
                </div>
              ) : evidence ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10">
                  <AlertCircle className="h-5 w-5 text-warning" aria-hidden="true" />
                  <span className="font-medium text-warning">Pending Review</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No evidence submitted</p>
              )}
            </div>
          </section>

          {evidence && evidence.status === "PENDING" && (
            <section className="card-surface p-4">
              <SectionHeading title="Review actions" />
              <div className="space-y-2">
                <Button
                  onClick={() => setVerifyOpen(true)}
                  className="w-full"
                  variant="default"
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" aria-hidden="true" />
                  Approve evidence
                </Button>
                <Button
                  onClick={() => setRejectOpen(true)}
                  variant="outline"
                  className="text-destructive full border-destructive/30 hover:bg-destructive/5"
                >
                  <XCircle className="h-4 w-4 mr-2" aria-hidden="true" />
                  Reject evidence
                </Button>
              </div>
            </section>
          )}

          <section className="card-surface p-4">
            <SectionHeading title="Case info" />
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Rescuer</dt>
                <dd className="text-foreground">{report.rescuerName || "Unassigned"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Reporter</dt>
                <dd className="text-foreground">{report.reporterName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Reporter phone</dt>
                <dd className="text-foreground">{report.reporterPhone}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>

      {/* Verify Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve rescue evidence</DialogTitle>
            <DialogDescription>
              Confirming this evidence will mark the rescue as completed and close the case.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="verify-notes">Verification notes (optional)</Label>
            <Textarea
              id="verify-notes"
              placeholder="Add any notes about the verification process..."
              value={verifyNotes}
              onChange={(e) => setVerifyNotes(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rescuer-rating">Rate rescuer (1-5)</Label>
            <select
              id="rescuer-rating"
              value={rescuerRating}
              onChange={(e) => setRescuerRating(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>{value}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleVerify} disabled={processing}>
              {processing ? "Approving..." : "Approve & Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject rescue evidence</DialogTitle>
            <DialogDescription>
              The rescuer will be notified and must resubmit evidence addressing your concerns.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason for rejection</Label>
            <Textarea
              id="reject-reason"
              placeholder="Explain what needs to be corrected or improved..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={processing || !rejectReason.trim()}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processing ? "Rejecting..." : "Reject evidence"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
