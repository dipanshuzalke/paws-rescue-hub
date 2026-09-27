import { Camera, ImagePlus, Upload, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [images, setImages] = useState<SubmissionImage[]>([]);
  const [notes, setNotes] = useState("");
  const [condition, setCondition] = useState("");
  const [treatmentNotes, setTreatmentNotes] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files);
    const validImages = selectedFiles.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return (
        file.type.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension ?? "")
      );
    });

    if (validImages.length === 0) {
      toast.error("The captured file could not be read as an image. Please try again.");
      return;
    }

    const next: SubmissionImage[] = validImages.slice(0, 10 - images.length).map((file) => ({
      id: `${file.name}-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(file),
      file,
    }));

    setImages((prev) => [...prev, ...next].slice(0, 10));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  const openCamera = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      setCameraStream(stream);
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          void videoRef.current.play().catch(() => {});
        }
      });
    } catch (error) {
      console.error("Camera access failed:", error);
      toast.error("Unable to access the camera. Please choose a photo instead.");
      cameraInputRef.current?.click();
    }
  };

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) return;

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return;

    context.drawImage(video, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (!blob) return;

        const file = new File([blob], `evidence-${Date.now()}.jpg`, {
          type: "image/jpeg",
        });

        const fileList = new DataTransfer();
        fileList.items.add(file);
        addFiles(fileList.files);
        closeCamera();
      },
      "image/jpeg",
      0.9,
    );
  };

  useEffect(() => {
    if (!open) {
      closeCamera();
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

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
    <>
      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            closeCamera();
          }
          onOpenChange(nextOpen);
        }}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submit rescue evidence</DialogTitle>
            <DialogDescription>
              Provide photos and details to confirm the rescue. This will be reviewed by your organization.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="mb-2 block">
                Photos <span className="text-destructive">*</span>
              </Label>

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
                  "rounded-xl border-2 border-dashed p-6 transition-colors",
                  dragOver ? "border-primary bg-primary-soft/40" : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex flex-col items-center justify-center text-center">
                  <ImagePlus className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden="true" />

                  <p className="text-sm font-medium">Add photos of the animal</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Capture a live photo or upload existing photos
                  </p>
                </div>

                <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="default"
                    disabled={images.length >= 10}
                    onClick={openCamera}
                    className="gap-2"
                  >
                    <Camera className="h-4 w-4" aria-hidden="true" />
                    Take Photo
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    disabled={images.length >= 10}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-2"
                  >
                    <Upload className="h-4 w-4" aria-hidden="true" />
                    Upload Photos
                  </Button>
                </div>

                <p className="mt-4 text-center text-xs text-muted-foreground">
                  You can also drag & drop photos here
                </p>

                <p className="mt-1 text-center text-xs text-muted-foreground">
                  {images.length}/10 photos added
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />

                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => {
                    addFiles(e.target.files);
                    e.target.value = "";
                  }}
                />
              </div>

              {images.length > 0 && (
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewImage(img.url)}
                        className="h-full w-full cursor-zoom-in"
                        aria-label="View uploaded evidence photo"
                      >
                        <img
                          src={img.url}
                          alt="Evidence file"
                          className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                        />
                      </button>

                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => removeImage(img.id)}
                        className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/70 text-background opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {previewImage && (
                <div
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
                  onClick={() => setPreviewImage(null)}
                >
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                    aria-label="Close image preview"
                  >
                    <X className="h-6 w-6" />
                  </button>

                  <img
                    src={previewImage}
                    alt="Evidence preview"
                    className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}
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

      {cameraOpen &&
        createPortal(
          <div
            className="pointer-events-auto fixed inset-0 z-[10001] flex items-center justify-center bg-black/80 p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="pointer-events-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <h2 className="text-base font-semibold">Take Animal Photo</h2>
                  <p className="text-xs text-muted-foreground">
                    Position the animal inside the camera frame
                  </p>
                </div>

                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeCamera();
                  }}
                  className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
                  aria-label="Close camera"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="relative aspect-video w-full bg-black">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="h-full w-full object-cover"
                />

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="h-3/4 w-3/4 rounded-2xl border-2 border-white/70" />
                </div>
              </div>

              <div className="flex items-center justify-center gap-4 px-4 py-5">
                <Button
                  type="button"
                  variant="outline"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    closeCamera();
                  }}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    capturePhoto();
                  }}
                  disabled={images.length >= 10}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  Capture Photo
                </Button>
              </div>
            </div>

            <canvas ref={canvasRef} className="hidden" />
          </div>,
          document.body,
        )}
    </>
  );
}
