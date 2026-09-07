import { useMemo, useState } from "react";
import { toast } from "sonner";

import { AvailabilityBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { initials } from "@/lib/format";
import { mockRescuers } from "@/data/mockUsers";
import { useAsync } from "@/hooks/use-async";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";
import type { RescueReport } from "@/types";

export function AssignDialog({
  report,
  open,
  onOpenChange,
}: {
  report: RescueReport | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { assignRescuer, user, apiMode } = useApp();
  const [selected, setSelected] = useState<string | null>(null);

  const { data } = useAsync(
    () =>
      apiMode
        ? ngoService.getRescuers({ limit: 200 }).then((r) => r.items)
        : Promise.resolve(mockRescuers),
    [apiMode],
  );

  const rescuers = useMemo(
    () => [...(data ?? [])].sort((a, b) => a.distanceKm - b.distanceKm),
    [data],
  );

  if (!report) return null;

  const handleAssign = async () => {
    const rescuer = rescuers.find((r) => r.id === selected);
    if (!rescuer) {
      toast.error("Choose a rescuer to assign this request.");
      return;
    }
    try {
      await assignRescuer(report.id, rescuer.id, rescuer.name, user?.organization);
      toast.success(`${rescuer.name} has been assigned to rescue #${report.id}.`);
      setSelected(null);
      onOpenChange(false);
    } catch {
      toast.error("Could not assign this request. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Assign a rescuer</DialogTitle>
          <DialogDescription>
            Choose the best-suited rescuer for #{report.id} — {report.title}.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
          {rescuers.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r.id)}
              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                selected === r.id
                  ? "border-primary bg-primary-soft"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback>{initials(r.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                  <AvailabilityBadge value={r.availability} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {r.organization} · {r.distanceKm} km away · {r.activeCases} active ·{" "}
                  {r.rating > 0 ? `${r.rating.toFixed(1)}★` : "Not rated"} · avg {r.avgResponseMins}m
                </p>
              </div>
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selected}>
            Assign rescuer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
