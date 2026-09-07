import { Link as LinkIcon, Unlink } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { SectionHeading } from "@/components/shared/page-header";
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
import { formatDateTime } from "@/lib/format";
import { duplicateService } from "@/services/duplicateService";
import type { DuplicateMatch, RescueReport } from "@/types";

export interface DuplicateComparisonPanelProps {
  report: RescueReport;
  matches: DuplicateMatch[];
  onDuplicateLinked?: (linkedId: string) => void;
}

export function DuplicateComparisonPanel({
  report,
  matches,
  onDuplicateLinked,
}: DuplicateComparisonPanelProps) {
  const [localMatches, setLocalMatches] = useState(matches);
  const [selectedMatch, setSelectedMatch] = useState<DuplicateMatch | null>(null);
  const [linkOpen, setLinkOpen] = useState(false);
  const [keepOpen, setKeepOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

  if (localMatches.length === 0) {
    return null;
  }

  const handleLinkDuplicate = async () => {
    if (!selectedMatch) return;

    setProcessing(true);
    try {
      await duplicateService.markDuplicate(report.id, selectedMatch.id, notes);
      toast.success(`Linked to case #${selectedMatch.reportId}`);
      setLinkOpen(false);
      setSelectedMatch(null);
      setNotes("");
      onDuplicateLinked?.(selectedMatch.reportId);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to link duplicate");
    } finally {
      setProcessing(false);
    }
  };

  const handleKeepSeparate = async () => {
    if (!selectedMatch) return;

    setProcessing(true);
    try {
      await duplicateService.keepSeparate(report.id, notes);
      toast.success("Case marked as separate");
      setKeepOpen(false);
      setLocalMatches((prev) => prev.filter((m) => m.id !== selectedMatch.id));
      setSelectedMatch(null);
      setNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update case");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <section className="card-surface p-4 border-primary/30 bg-primary/5">
        <SectionHeading title="Potential duplicates" description={`${localMatches.length} similar case${localMatches.length !== 1 ? "s" : ""} found`} />

        <div className="space-y-3 mt-4">
          {localMatches.map((match) => (
            <div
              key={match.id}
              className="flex gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              {match.images.length > 0 && (
                <img
                  src={match.images[0]}
                  alt={`${match.condition} ${match.animal}`}
                  className="h-16 w-16 rounded-lg object-cover shrink-0"
                />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {match.count} × {match.animal}
                    </p>
                    <p className="text-xs text-muted-foreground">{match.condition}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="rounded-full px-2 py-1 bg-primary/10 text-xs font-medium text-primary">
                      {Math.round(match.score * 100)}% match
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground mt-1">
                  #{match.reportId} · {match.area} · {formatDateTime(match.createdAt)}
                </p>

                <div className="flex gap-1.5 mt-2">
                  <PriorityBadge level={match.emergency} />
                  <StatusBadge status={match.status} />
                </div>
              </div>

              <div className="flex gap-1 shrink-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMatch(match);
                    setLinkOpen(true);
                  }}
                  title="Link this case as a duplicate"
                >
                  <LinkIcon className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedMatch(match);
                    setKeepOpen(true);
                  }}
                  title="Keep as separate case"
                >
                  <Unlink className="h-3.5 w-3.5" aria-hidden="true" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Link Dialog */}
      <Dialog open={linkOpen} onOpenChange={setLinkOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Link as duplicate</DialogTitle>
            <DialogDescription>
              Case #{report.id} will be linked to #{selectedMatch?.reportId} as a duplicate. The reporter will be
              notified.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="link-notes">Notes (optional)</Label>
            <Textarea
              id="link-notes"
              placeholder="Add a note explaining why these are the same case..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLinkOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleLinkDuplicate} disabled={processing}>
              {processing ? "Linking..." : "Link duplicates"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Keep Separate Dialog */}
      <Dialog open={keepOpen} onOpenChange={setKeepOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Keep as separate case</DialogTitle>
            <DialogDescription>
              Case #{report.id} will be treated as a separate rescue request distinct from #{selectedMatch?.reportId}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="separate-notes">Notes (optional)</Label>
            <Textarea
              id="separate-notes"
              placeholder="Add a note explaining why these are different cases..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setKeepOpen(false)} disabled={processing}>
              Cancel
            </Button>
            <Button onClick={handleKeepSeparate} disabled={processing}>
              {processing ? "Updating..." : "Keep separate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
