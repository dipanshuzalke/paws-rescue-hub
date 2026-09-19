import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Building2, MapPin, Phone, Shield, User as UserIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MapView } from "@/components/maps/map-view";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
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
import { useApp } from "@/store/app-store";
import type { RescueStatus } from "@/types";
import { NotesSection } from "@/components/shared/NotesSection";
import { useRescueLiveLocation } from "@/hooks/useRescueLiveLocation";

export const Route = createFileRoute("/admin/reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Case #${params.id} · Admin · ResQ Paws` },
      {
        name: "description",
        content: "Administrative view of a rescue case with full timeline and override controls.",
      },
      { property: "og:title", content: `Case #${params.id} · Admin · ResQ Paws` },
      {
        property: "og:description",
        content: "Inspect reporter, rescuer and NGO details and override case status.",
      },
    ],
  }),
  component: AdminReportDetail,
});

const allStatuses: RescueStatus[] = [
  "REPORTED",
  "ASSIGNED",
  "ACCEPTED",
  "IN_PROGRESS",
  "RESCUED",
  "CLOSED",
  "CANCELLED",
];

function AdminReportDetail() {
  const { id } = Route.useParams();
  const { reports, updateStatus } = useApp();
  const navigate = useNavigate();
  const [pending, setPending] = useState<RescueStatus | null>(null);

  const report = reports.find((r) => r.id === id);

    const {
    rescuerLocation: remoteRescuerLocation,
    rescuerName: liveRescuerName,
    tracking,
  } = useRescueLiveLocation(report?.id);

  if (!report) {
    return (
      <EmptyState
        title="Case not found"
        description="This rescue case may have been removed from the platform."
        action={
          <Button asChild variant="outline">
            <Link to="/admin/reports">Back to reports</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit"
        onClick={() => navigate({ to: "/admin/reports" })}
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to reports
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

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {report.images.length ? (
            <div className="card-surface p-5">
              <SectionHeading title="Photos" />
              <ReportImageGallery
                images={report.images}
                alt={`${report.condition} ${report.animal.toLowerCase()} photo`}
              />
            </div>
          ) : null}

          <div className="card-surface p-5">
            <SectionHeading title="Case details" />
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
                <dt className="text-xs text-muted-foreground">Created</dt>
                <dd className="font-medium text-foreground">{formatDateTime(report.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Last update</dt>
                <dd className="font-medium text-foreground">{formatDateTime(report.updatedAt)}</dd>
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
                  kind: "request",
                  label: `#${report.id}`,
                  sub: report.address,
                  coords: report.coords,
                  emergency: report.emergency,
                },
              ]}
              height="h-[320px]"
              tracking={tracking}
              remoteRescuerLocation={remoteRescuerLocation}
              showLiveLocation={tracking}
            />
          </div>

          <div className="card-surface p-5">
            <SectionHeading title="Status timeline" />
            <StatusTimeline entries={report.timeline} />
          </div>

          <NotesSection notes={report.notes} />
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
                {report.area}, {report.city}
              </p>
            </div>
          </div>

          <div className="card-surface p-5">
            <SectionHeading title="Handling team" />
            <div className="space-y-2 text-sm">
              <p className="flex items-center gap-2 text-foreground">
                <Shield className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                Rescuer: {report.rescuerName ?? "No rescuer assigned"}
              </p>
              {/* <p className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" aria-hidden="true" />
                {report.ngoName ?? "No NGO assigned"}
              </p> */}
            </div>
          </div>

          <div className="card-surface p-5">
            <SectionHeading
              title="Admin override"
              description="Force a status change on this case. Use with care."
            />
            <Select value={report.status} onValueChange={(v) => setPending(v as RescueStatus)}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {allStatuses.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={!!pending}
        onOpenChange={(v) => !v && setPending(null)}
        title="Override case status?"
        description={`Case #${report.id} will be moved to ${pending?.replace("_", " ").toLowerCase() ?? ""}. This is logged as an administrative action.`}
        confirmLabel="Override status"
        onConfirm={() => {
          if (pending) {
            updateStatus(report.id, pending);
            toast.success(
              `Case #${report.id} overridden to ${pending.replace("_", " ").toLowerCase()}.`,
            );
          }
          setPending(null);
        }}
      />
    </div>
  );
}
