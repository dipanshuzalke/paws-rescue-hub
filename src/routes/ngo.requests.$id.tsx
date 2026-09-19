import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Link2, Loader2, MapPin, Phone, User as UserIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { AssignDialog } from "@/components/ngo/assign-dialog";
import { DuplicateComparisonPanel } from "@/components/ngo/duplicate-comparison-panel";
import { MapView } from "@/components/maps/map-view";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { ReportImageGallery } from "@/components/shared/report-image-gallery";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDateTime, timeAgo } from "@/lib/format";
import { duplicateService } from "@/services/duplicateService";
import { useApp } from "@/store/app-store";
import type { DuplicateMatch, RescueStatus } from "@/types";
import { useRescueLiveLocation } from "@/hooks/useRescueLiveLocation";
import { NotesSection } from "@/components/shared/NotesSection";

export const Route = createFileRoute("/ngo/requests/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Request #${params.id} · ResQ Paws` },
      { name: "description", content: "Rescue request detail, timeline and assignment panel." },
      { property: "og:title", content: `Request #${params.id} · ResQ Paws` },
      {
        property: "og:description",
        content: "Review photos, location and status for this rescue request.",
      },
    ],
  }),
  component: NgoRequestDetail,
});

const nextStatuses: Partial<Record<RescueStatus, RescueStatus[]>> = {
  ASSIGNED: ["ACCEPTED", "CANCELLED"],
  ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["RESCUED"],
  RESCUED: ["CLOSED"],
};

function NgoRequestDetail() {
  const { id } = Route.useParams();
  const { reports, updateStatus } = useApp();
  const navigate = useNavigate();
  const [assignOpen, setAssignOpen] = useState(false);
  const [duplicates, setDuplicates] = useState<DuplicateMatch[]>([]);
  const [loadingDuplicates, setLoadingDuplicates] = useState(false);

  const report = reports.find((r) => r.id === id);

  const {
    rescuerLocation: remoteRescuerLocation,
    rescuerName: liveRescuerName,
    tracking,
  } = useRescueLiveLocation(report?.id);

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

  if (!report) {
    return (
      <EmptyState
        title="Request not found"
        description="This rescue request may have been removed."
        action={
          <Button asChild variant="outline">
            <Link to="/ngo/requests">Back to requests</Link>
          </Button>
        }
      />
    );
  }

  const options = nextStatuses[report.status] ?? [];

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => navigate({ to: "/ngo/requests" })}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to requests
      </Button>

      <PageHeader
        title={`#${report.id} · ${report.title}`}
        description={`Reported ${timeAgo(report.createdAt)} in ${report.area}, ${report.city}.`}
        actions={
          <>
            <PriorityBadge level={report.emergency} />
            <StatusBadge status={report.status} />
          </>
        }
      />

      {report.duplicateOfId ? (
        <div className="flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
          <Link2 className="h-5 w-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="text-sm font-medium text-foreground">Linked as duplicate</p>
            <p className="text-xs text-muted-foreground mt-1">
              This case is linked to{" "}
              <Link
                to="/ngo/requests/$id"
                params={{ id: report.duplicateOfId }}
                className="font-medium text-primary hover:underline"
              >
                #{report.duplicateOfId}
              </Link>
              .
            </p>
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <div className="card-surface p-5">
            <SectionHeading title="Photos" />
            <ReportImageGallery
              images={report.images}
              alt={`${report.condition} ${report.animal.toLowerCase()} photo`}
            />
          </div>

          <div className="card-surface p-5">
            <SectionHeading title="Details" />
            <p className="text-sm text-foreground">{report.description}</p>
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
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
                <dt className="text-xs text-muted-foreground">Address</dt>
                <dd className="font-medium text-foreground">{report.address}</dd>
              </div>
            </dl>
          </div>

          <div>
            <SectionHeading title="Location" />
            <MapView
              markers={[
                {
                  id: report.id,
                  label: `#${report.id}`,
                  sub: report.address,
                  coords: report.coords,
                  emergency: report.emergency,
                  kind: "request",
                },
              ]}
              height="h-[320px]"
              remoteRescuerLocation={remoteRescuerLocation}
            />
            {report.rescuerName && (
              <div className="mt-4 rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Live Rescue Tracking</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      {liveRescuerName ?? report.rescuerName}
                    </p>
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-medium ${
                      tracking ? "bg-green-500/10 text-green-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
                        tracking ? "bg-green-500 animate-pulse" : "bg-muted-foreground"
                      }`}
                    />
                    {tracking ? "Live" : "Not sharing"}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card-surface p-5">
            <SectionHeading title="Status timeline" />
            <StatusTimeline entries={report.timeline} />
          </div>

          <NotesSection notes={report.notes} />

          {loadingDuplicates ? (
            <div className="card-surface p-5">
              <div className="flex items-center justify-center py-4">
                <Loader2
                  className="h-5 w-5 animate-spin text-muted-foreground"
                  aria-label="Loading duplicates..."
                />
              </div>
            </div>
          ) : duplicates.length > 0 ? (
            <DuplicateComparisonPanel
              report={report}
              matches={duplicates}
              onDuplicateLinked={() => {
                setDuplicates([]);
                navigate({ to: "/ngo/requests" });
              }}
            />
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="card-surface p-5">
            <SectionHeading title="Reporter" />
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-foreground">
                <UserIcon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                {report.reporterName}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" aria-hidden="true" />
                {report.reporterPhone}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                {report.address}
              </p>
            </div>
          </div>

          <div className="card-surface p-5">
            <SectionHeading title="Assignment" />
            {report.rescuerName ? (
              <div className="space-y-1 text-sm">
                <p className="font-medium text-foreground">{report.rescuerName}</p>
                {/* <p className="text-muted-foreground">{report.ngoName ?? "—"}</p> */}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3 w-full"
                  onClick={() => setAssignOpen(true)}
                >
                  Reassign rescuer
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  No rescuer assigned to this request yet.
                </p>
                <Button className="w-full" onClick={() => setAssignOpen(true)}>
                  Assign rescuer
                </Button>
              </div>
            )}
          </div>

          {options.length > 0 ? (
            <div className="card-surface p-5">
              <SectionHeading title="Update status" />
              <Select
                onValueChange={(v) => {
                  updateStatus(report.id, v as RescueStatus);
                  toast.success(
                    `Request #${report.id} marked as ${v.replace("_", " ").toLowerCase()}.`,
                  );
                }}
              >
                <SelectTrigger className="bg-card">
                  <SelectValue placeholder="Move to next status" />
                </SelectTrigger>
                <SelectContent>
                  {options.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.replace("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      </div>

      <AssignDialog report={report} open={assignOpen} onOpenChange={setAssignOpen} />
    </div>
  );
}
