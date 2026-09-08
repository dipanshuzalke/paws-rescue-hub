import { AlertCircle, Check, MapPin } from "lucide-react";
import { useState } from "react";

import { PriorityBadge } from "@/components/shared/status-badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { formatDateTime } from "@/lib/format";
import type { DuplicateMatch } from "@/types";

export interface DuplicateWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matches: DuplicateMatch[];
  onContinue: () => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export function DuplicateWarningDialog({
  open,
  onOpenChange,
  matches,
  onContinue,
  onCancel,
  isSubmitting = false,
}: DuplicateWarningDialogProps) {
  const [acknowledged, setAcknowledged] = useState(false);

  const handleContinue = () => {
    if (acknowledged) {
      onContinue();
    }
  };

  if (matches.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 shrink-0 text-warning mt-0.5" aria-hidden="true" />
            <div>
              <DialogTitle>Similar rescue request found</DialogTitle>
              <DialogDescription>
                We found {matches.length} case{matches.length !== 1 ? "s" : ""} in your area that might be the same
                animal. Please review before submitting.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto py-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="flex gap-4 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors"
            >
              {match.images.length > 0 ? (
                <img
                  src={match.images[0]}
                  alt={`${match.condition} ${match.animal}`}
                  className="h-24 w-24 shrink-0 rounded-lg object-cover"
                />
              ) : (
                <div className="h-24 w-24 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">No photo</span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground">
                      {match.count} × {match.animal}
                    </p>
                    <p className="text-sm text-muted-foreground">{match.condition}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <PriorityBadge level={match.emergency} />
                    <div className="rounded-full px-2 py-1 bg-primary/10 text-xs font-medium text-primary">
                      {Math.round(match.score * 100)}% match
                    </div>
                  </div>
                </div>

                <p className="mt-2 text-sm text-muted-foreground">
                  <MapPin className="inline h-3.5 w-3.5 mr-1" aria-hidden="true" />
                  {match.area}, {match.city}
                </p>

                <p className="text-xs text-muted-foreground mt-1">
                  Reported {Math.round(match.minutesAgo / 60)} hours ago 
                </p>

                {match.reasons.length > 0 ? (
                  <div className="mt-2 text-xs text-muted-foreground">
                    <p className="font-medium">Why this match:</p>
                    <ul className="mt-1 space-y-0.5">
                      {match.reasons.map((reason, i) => (
                        <li key={i} className="flex gap-1">
                          <Check className="h-3 w-3 shrink-0 text-success mt-0.5" aria-hidden="true" />
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 border-t pt-4">
          <Label className="flex items-start gap-2 cursor-pointer">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(checked) => setAcknowledged(Boolean(checked))}
              className="mt-1"
            />
            <span className="text-sm text-foreground">
              I've reviewed the similar cases above and confirm this is a different animal needing rescue.
            </span>
          </Label>
          <p className="text-xs text-muted-foreground">
            If this is the same animal, you can link it to the existing case after review.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!acknowledged || isSubmitting}
            className="relative"
          >
            {isSubmitting ? (
              <>
                <span className="opacity-0">Continue</span>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                </div>
              </>
            ) : (
              "Continue"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
