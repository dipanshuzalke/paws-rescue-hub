import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ArrowLeft,
  Camera,
  MapPin,
  MessageCircle,
  Navigation,
  Phone,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { MapView, type MapMarker } from "@/components/maps/map-view";
import { useCurrentRescuer } from "@/components/rescuer/use-current-rescuer";
import { EvidenceSubmissionDialog } from "@/components/rescuer/evidence-submission-dialog";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { ReportImageGallery } from "@/components/shared/report-image-gallery";
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
import { formatDateTime, timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/rescuer/requests/$id")({
  head: () => ({
    meta: [
      { title: "Request Details · ResQ Paws" },
      {
        name: "description",
        content: "View rescue request details and manage the rescue lifecycle.",
      },
      { property: "og:title", content: "Request Details · ResQ Paws" },
      {
        property: "og:description",
        content: "View rescue request details and manage the rescue lifecycle.",
      },
    ],
  }),
  component: RescuerRequestDetail,
});

function RescuerRequestDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const { reports, updateStatus, addNote, user } = useApp();
  const rescuer = useCurrentRescuer();
  const report = useMemo(() => reports.find((r) => r.id === id), [reports, id]);
  const [evidenceOpen, setEvidenceOpen] = useState(false);
  const [completeOpen, setCompleteOpen] = useState(false);
  const [outcome, setOutcome] = useState("");

  const handleEvidenceSuccess = (updated: typeof report) => {
    if (updated) {
      const idx = reports.findIndex((r) => r.id === id);
      if (idx >= 0) {
        reports[idx] = updated;
      }
    }
  };

  if (!report) {
    return (
      <div className="space-y-4">
        <Link
          to="/rescuer/requests"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to requests
        </Link>
        <EmptyState title="Request not found" description="This request may have been closed." />
      </div>
    );
  }

  const isMine = report.rescuerId === user?.id;

  const markers: MapMarker[] = [
    { id: "you", label: "You", coords: rescuer.coords, kind: "you" },
    {
      id: report.id,
      label: report.title,
      sub: report.area,
      coords: report.coords,
      emergency: report.emergency,
      kind: "request",
    },
  ];

  const handleAccept = () => {
    updateStatus(report.id, "ACCEPTED", `Accepted by ${user?.name ?? "rescuer"}.`);
    toast.success("Request accepted.");
  };

  const handleOnTheWay = () => {
    updateStatus(report.id, "IN_PROGRESS", `${user?.name ?? "Rescuer"} is on the way.`);
    toast.success("Status updated: on the way.");
  };

  const handleComplete = () => {
    updateStatus(report.id, "RESCUED", outcome || "Animal rescued successfully.");
    if (outcome) addNote(report.id, outcome);
    setCompleteOpen(false);
    setOutcome("");
    toast.success("Rescue marked as completed. Great work!");
  };

  return (
    <div className="space-y-6">
      <Link
        to="/rescuer/requests"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to requests
      </Link>

      <PageHeader
        title={report.title}
        description={`#${report.id} · Reported ${timeAgo(report.createdAt)}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <PriorityBadge level={report.emergency} />
            <StatusBadge status={report.status} />
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="card-surface p-4">
            <SectionHeading title="Photos" />
            <ReportImageGallery
              images={report.images}
              alt={`${report.condition} ${report.animal.toLowerCase()} photo`}
            />
          </section>

          <section className="card-surface p-4">
            <SectionHeading title="Description" />
            <p className="text-sm text-foreground/90">{report.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-xs text-muted-foreground">Animal</dt>
                <dd className="font-medium text-foreground">{report.animal}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Count</dt>
                <dd className="font-medium text-foreground">{report.count}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Condition</dt>
                <dd className="font-medium text-foreground">{report.condition}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Reported</dt>
                <dd className="font-medium text-foreground">{formatDateTime(report.createdAt)}</dd>
              </div>
            </dl>
          </section>

          <section className="card-surface p-4">
            <SectionHeading
              title="Location & route"
              description={`${report.distanceKm} km away · ETA ${Math.max(3, Math.round(report.distanceKm * 4))} min`}
            />
            <p className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden="true" />
              {report.address}, {report.area}, {report.city}
            </p>
            <MapView markers={markers} height="h-[320px]" />
          </section>

          <section className="card-surface p-4">
            <SectionHeading title="Status timeline" />
            <StatusTimeline entries={report.timeline} />
          </section>
        </div>

        <div className="space-y-6">
          <section className="card-surface p-4">
            <SectionHeading title="Reporter contact" />
            <p className="font-semibold text-foreground">{report.reporterName}</p>
            <p className="text-sm text-muted-foreground">{report.reporterPhone}</p>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" asChild>
                <a href={`tel:${report.reporterPhone}`}>
                  <Phone className="h-4 w-4" aria-hidden="true" /> Call
                </a>
              </Button>
              <Button variant="outline" className="flex-1" asChild disabled={!report.reporterPhone}>
                <a
                  href={`sms:${report.reporterPhone}?body=${encodeURIComponent(
                    `Hello ${report.reporterName}, this is ${user?.name ?? "your rescuer"} from ResQ Paws regarding report #${report.id}.`,
                  )}`}
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" /> Message
                </a>
              </Button>
            </div>
          </section>

          <section className="card-surface p-4">
            <SectionHeading title="Actions" />
            <div className="flex flex-col gap-2">
              {report.status === "REPORTED" || report.status === "ASSIGNED" ? (
                <Button onClick={handleAccept}>Accept request</Button>
              ) : null}
              {isMine && report.status === "ACCEPTED" ? (
                <Button onClick={handleOnTheWay}>
                  <Navigation className="h-4 w-4" aria-hidden="true" /> Mark on the way
                </Button>
              ) : null}
              {isMine && report.status === "IN_PROGRESS" ? (
                <Button onClick={() => setEvidenceOpen(true)}>Mark rescued</Button>
              ) : null}
              {report.status === "RESCUED" || report.status === "CLOSED" ? (
                <p className="text-sm text-muted-foreground">
                  This rescue has been completed.
                </p>
              ) : null}
              {!isMine && report.status !== "REPORTED" && report.status !== "ASSIGNED" ? (
                <p className="text-sm text-muted-foreground">
                  Assigned to {report.rescuerName ?? "another rescuer"}.
                </p>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {report ? (
        <EvidenceSubmissionDialog
          open={evidenceOpen}
          onOpenChange={setEvidenceOpen}
          report={report}
          onSuccess={handleEvidenceSuccess}
        />
      ) : null}

      <Dialog open={completeOpen} onOpenChange={setCompleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark rescue as completed</DialogTitle>
            <DialogDescription>
              Add outcome notes for the record. This will be visible to the reporter and NGO.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="outcome-notes">Outcome notes</Label>
            <Textarea
              id="outcome-notes"
              placeholder="e.g. Animal treated on site and released back safely."
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              rows={4}
            />
            <Button variant="outline" type="button" className="w-full" disabled>
              <Camera className="h-4 w-4" aria-hidden="true" /> Attach photo (optional)
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCompleteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleComplete}>Confirm rescue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
