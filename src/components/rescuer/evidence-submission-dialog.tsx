import { ImagePlus, MapPin, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { evidenceService } from "@/services/evidenceService";
import type { RescueReport } from "@/types";

export interface EvidenceSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  report: RescueReport;
  onSuccess: (updated: RescueReport) => void;
}

interface SubmissionImage {
  id: string;
  url: string;
  file: File;
}

export function EvidenceSubmissionDialog({
  open,
  onOpenChange,
  report,
  onSuccess,
}: EvidenceSubmissionDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<SubmissionImage[]>([]);
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: SubmissionImage[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), file: f }));
    setImages((prev) => [...prev, ...next].slice(0, 10));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const handleSubmit = async () => {
    if (images.length === 0) {
      toast.error("Please add at least one photo");
      return;
    }

    if (!notes.trim()) {
      toast.error("Please provide rescue notes");
      return;
    }

    setSubmitting(true);
    try {
      const updated = await evidenceService.submit(report.id, {
        files: images.map((i) => i.file),
        notes: notes.trim(),
        animalCondition: condition.trim(),
        treatmentNotes: treatmentNotes.trim(),
      });

      toast.success("Evidence submitted for verification");
      onSuccess(updated);
      onOpenChange(false);
      setImages([]);
      setNotes("");
      setCondition("");
      setTreatmentNotes("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit evidence");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit rescue evidence</DialogTitle>
          <DialogDescription>
            Provide photos and details to confirm the rescue. This will be reviewed by your organization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div>
            <Label className="mb-2 block">Photos (required)</Label>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                addFiles(e.dataTransfer.files);
              }}
              className={cn(
                "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center transition-colors",
                dragOver ? "border-primary bg-primary-soft/40" : "border-border",
              )}
            >
              <ImagePlus className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">
                Drag & drop photos here, or{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse files
                </button>
              </p>
              <p className="text-xs text-muted-foreground">Maximum 10 photos</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => addFiles(e.target.files)}
              />
            </div>

            {images.length > 0 ? (
              <div className="mt-3 grid grid-cols-4 gap-3 sm:grid-cols-5">
                {images.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                    <img src={img.url} alt="Evidence photo" className="h-full w-full object-cover" />
                    <button
                      type="button"
                      aria-label="Remove photo"
                      onClick={() => removeImage(img.id)}
                      className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/70 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="mt-2 text-xs text-muted-foreground">
              {images.length} of 10 photos added
            </p>
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="rescue-notes">
              Rescue notes (required)
            </Label>
            <Textarea
              id="rescue-notes"
              placeholder="Describe what happened during the rescue, the animal's state, and any immediate actions taken..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="animal-condition">
              Animal's condition (optional)
            </Label>
            <Input
              id="animal-condition"
              placeholder="e.g. Injured leg, dehydrated, conscious"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
            />
          </div>

          <div>
            <Label className="mb-2 block" htmlFor="treatment-notes">
              Treatment provided (optional)
            </Label>
            <Textarea
              id="treatment-notes"
              placeholder="Describe any first aid or medical treatment provided..."
              value={treatmentNotes}
              onChange={(e) => setTreatmentNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">What happens next?</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>Your organization will review the evidence you submit</li>
              <li>The reporter will receive updates on the verification status</li>
              <li>Once verified, the rescue case will be marked as closed</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || images.length === 0 || !notes.trim()}>
            {submitting ? "Submitting..." : "Submit evidence"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
