import { Link, createFileRoute } from "@tanstack/react-router";
import { Loader2, Phone, MessageSquare, Send, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { MapView } from "@/components/maps/map-view";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { StatusTimeline } from "@/components/shared/status-timeline";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime, initials, timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/citizen/reports/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Report ${params.id} · ResQ Paws` },
      { name: "description", content: "Track the status of your rescue report in real time." },
      { property: "og:title", content: `Report ${params.id} · ResQ Paws` },
      { property: "og:description", content: "Track the status of your rescue report in real time." },
    ],
  }),
  component: CitizenReportDetail,
});

function CitizenReportDetail() {
  const { id } = Route.useParams();
  const { reports, addNote, updateStatus, loading, authReady } = useApp();
  const report = reports.find((r) => r.id === id);

  const [note, setNote] = useState("");
  const [cancelOpen, setCancelOpen] = useState(false);
  const [activeImg, setActiveImg] = useState(0);
  const [imageOpen, setImageOpen] = useState(false);

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
        <p className="mt-1 text-sm text-muted-foreground">This rescue report may have been removed.</p>
        <Button asChild className="mt-4">
          <Link to="/citizen/reports">Back to my reports</Link>
        </Button>
      </div>
    );
  }

  const canCancel = !["RESCUED", "CLOSED", "CANCELLED"].includes(report.status);

  const handleAddNote = () => {
    if (!note.trim()) return;
    addNote(report.id, note.trim());
    setNote("");
    toast.success("Note added");
  };

  const handleCancel = () => {
    updateStatus(report.id, "CANCELLED", "Cancelled by reporter.");
    setCancelOpen(false);
    toast.success("Report cancelled");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">#{report.id}</p>
          <h1 className="font-display text-2xl font-bold text-foreground">{report.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <StatusBadge status={report.status} />
            <PriorityBadge level={report.emergency} />
            <span className="text-xs text-muted-foreground">Reported {timeAgo(report.createdAt)}</span>
          </div>
        </div>
        {canCancel ? (
          <Button variant="outline" className="text-destructive" onClick={() => setCancelOpen(true)}>
            <XCircle className="h-4 w-4" aria-hidden="true" />
            Cancel report
          </Button>
        ) : null}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          {report.images.length > 0 ? (
            <div className="card-surface p-3">
              <button
                type="button"
                className="block aspect-video w-full overflow-hidden rounded-lg bg-muted"
                onClick={() => setImageOpen(true)}
                aria-label="View report image full screen"
              >
                <img
                  src={report.images[activeImg]}
                  alt={`${report.condition} ${report.animal} in ${report.area}`}
                  className="h-full w-full object-cover"
                />
              </button>
              {report.images.length > 1 ? (
                <div className="mt-3 flex gap-2">
                  {report.images.map((img, i) => (
                    <button
                      key={img + i}
                      type="button"
                      onClick={() => setActiveImg(i)}
                      className={`h-14 w-14 shrink-0 overflow-hidden rounded-md border-2 ${
                        i === activeImg ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <Dialog open={imageOpen} onOpenChange={setImageOpen}>
            <DialogContent className="h-dvh w-screen max-w-none rounded-none border-0 bg-black/95 p-2 text-white [&>button]:text-white [&>button]:opacity-100 sm:h-[95vh] sm:w-[95vw] sm:rounded-lg">
              <DialogTitle className="sr-only">Report image</DialogTitle>
              <div className="flex h-full items-center justify-center">
                <img
                  src={report.images[activeImg]}
                  alt={`${report.condition} ${report.animal} in ${report.area}`}
                  className="max-h-full max-w-full object-contain"
                />
              </div>
            </DialogContent>
          </Dialog>

          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Details</h2>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>
                <dd className="text-sm text-foreground">{report.count} × {report.animal}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Condition</dt>
                <dd className="text-sm text-foreground">{report.condition}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Location</dt>
                <dd className="text-sm text-foreground">{report.address}, {report.area}, {report.city}</dd>
              </div>
              {report.description ? (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-muted-foreground">Description</dt>
                  <dd className="text-sm text-foreground">{report.description}</dd>
                </div>
              ) : null}
            </dl>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Status timeline</h2>
            <div className="mt-4">
              <StatusTimeline entries={report.timeline} />
            </div>
          </div>

          <div className="card-surface p-5">
            <h2 className="font-display text-lg font-bold text-foreground">Notes</h2>
            <div className="mt-3 space-y-3">
              {report.notes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No notes yet.</p>
              ) : (
                report.notes.map((n) => (
                  <div key={n.id} className="flex gap-3">
                    <Avatar className="h-8 w-8"><AvatarFallback>{initials(n.author)}</AvatarFallback></Avatar>
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

        <div className="space-y-6">
          {report.rescuerName ? (
            <div className="card-surface p-5">
              <h2 className="font-display text-lg font-bold text-foreground">Assigned rescuer</h2>
              <div className="mt-3 flex items-center gap-3">
                <Avatar className="h-11 w-11"><AvatarFallback>{initials(report.rescuerName)}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{report.rescuerName}</p>
                  <p className="truncate text-xs text-muted-foreground">{report.ngoName ?? "Independent rescuer"}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" className="flex-1">
                  <Phone className="h-4 w-4" aria-hidden="true" /> Call
                </Button>
                <Button variant="outline" className="flex-1">
                  <MessageSquare className="h-4 w-4" aria-hidden="true" /> Message
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

          <div className="card-surface p-3">
            <h2 className="px-2 pt-2 font-display text-lg font-bold text-foreground">Location</h2>
            <div className="mt-2">
              <MapView
                height="h-[220px]"
                markers={[{ id: report.id, label: report.title, sub: report.area, coords: report.coords, emergency: report.emergency }]}
              />
            </div>
          </div>
        </div>
      </div>

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
