import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  ImagePlus,
  Loader2,
  Locate,
  MapPin,
  Minus,
  Plus,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ANIMAL_OPTIONS,
  CONDITION_OPTIONS,
  EMERGENCY_OPTIONS,
  WizardStepper,
} from "@/components/citizen/report-wizard-steps";
import { DuplicateWarningDialog } from "@/components/citizen/duplicate-warning-dialog";
import { MapView } from "@/components/maps/map-view";
import { PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { duplicateService } from "@/services/duplicateService";
import { useApp } from "@/store/app-store";
import type { AnimalType, Condition, Emergency, DuplicateCheckResult } from "@/types";

export const Route = createFileRoute("/citizen/report")({
  head: () => ({
    meta: [
      { title: "Report an Animal · ResQ Paws" },
      { name: "description", content: "Report a stray or injured animal in a few quick steps." },
      { property: "og:title", content: "Report an Animal · ResQ Paws" },
      {
        property: "og:description",
        content: "Report a stray or injured animal in a few quick steps.",
      },
    ],
  }),
  component: CitizenReport,
});

const STEPS = ["Animal details", "Location", "Review & submit"];

interface WizardImage {
  id: string;
  url: string;
  file: File;
}

function CitizenReport() {
  const { createReport } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const [animal, setAnimal] = useState<AnimalType | null>(null);
  const [customAnimal, setCustomAnimal] = useState("");
  const [count, setCount] = useState(1);
  const [condition, setCondition] = useState<Condition | null>(null);
  const [emergency, setEmergency] = useState<Emergency | null>(null);

  const [address, setAddress] = useState("");
  const [area, setArea] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  const [images, setImages] = useState<WizardImage[]>([]);
  const [description, setDescription] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [duplicateWarningOpen, setDuplicateWarningOpen] = useState(false);
  const [duplicateResult, setDuplicateResult] = useState<DuplicateCheckResult | null>(null);
  const [checkingDuplicates, setCheckingDuplicates] = useState(false);
  const [duplicateSawAndAcknowledged, setDuplicateSawAndAcknowledged] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const errors: Partial<Record<number, string>> = {};

  if (step === 0) {
    if (!animal || !condition || !emergency) {
      errors[0] = "Select the animal type, condition and emergency level to continue.";
    } else if (animal === "Other" && !customAnimal.trim()) {
      errors[0] = "Specify the animal type to continue.";
    } else if (images.length === 0) {
      errors[0] = "Please upload at least one photo of the animal.";
    } else if (!contactPhone.trim()) {
      errors[0] = "Please provide a contact number.";
    }
  }

  if (step === 1 && (!address.trim() || !area.trim() || !coords)) {
    errors[1] = "Please detect your location and confirm the address and area to continue.";
  }

  const canProceed = !errors[step];

  <Button
    type="button"
    onClick={() => {
      if (step === 1) {
        void checkForDuplicates();
      } else if (canProceed) {
        setStep((s) => s + 1);
      }
    }}
    disabled={!canProceed || checkingDuplicates}
  >
    {checkingDuplicates ? (
      <>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
        Checking reports...
      </>
    ) : (
      "Continue"
    )}
  </Button>;

  const openCamera = async () => {
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      setCameraStream(stream);
      setCameraOpen(true);

      requestAnimationFrame(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
        }
      });
    } catch (error) {
      console.error("Camera access failed:", error);
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

        const file = new File([blob], `animal-${Date.now()}.jpg`, {
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

  const closeCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => {
        track.stop();
      });
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraStream(null);
    setCameraOpen(false);
  };

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop();
        });
      }
    };
  }, [cameraStream]);

  const checkForDuplicates = async () => {
    if (step !== 1 || !animal || !condition || !coords) return;

    const animalType = animal === "Other" ? customAnimal.trim() : animal;
    if (!animalType) return;

    setCheckingDuplicates(true);
    try {
      const result = await duplicateService.check({
        animal: animalType,
        condition,
        coords,
      });

      if (result.hasDuplicates && result.matches.length > 0) {
        setDuplicateResult(result);
        setDuplicateWarningOpen(true);
        return;
      }

      // No duplicates, proceed to review
      setDuplicateSawAndAcknowledged(true);
      setStep(2);
    } catch (err) {
      // On error, allow user to proceed (fail-open)
      setDuplicateSawAndAcknowledged(true);
      setStep(2);
    } finally {
      setCheckingDuplicates(false);
    }
  };

  const handleDuplicateContinue = () => {
    setDuplicateSawAndAcknowledged(true);
    setDuplicateWarningOpen(false);
    setStep(2);
  };

  const handleDuplicateCancel = () => {
    setDuplicateWarningOpen(false);
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const selectedFiles = Array.from(files);
    const imageFiles = selectedFiles.filter((file) => {
      const extension = file.name.split(".").pop()?.toLowerCase();
      return (
        file.type.startsWith("image/") ||
        ["jpg", "jpeg", "png", "webp", "heic", "heif"].includes(extension ?? "")
      );
    });

    if (imageFiles.length === 0) {
      toast.error("The captured file could not be read as an image. Please try again.");
      return;
    }

    setImages((prev) => {
      const remainingSlots = 6 - prev.length;

      if (remainingSlots <= 0) return prev;

      const next: WizardImage[] = imageFiles.slice(0, remainingSlots).map((file) => ({
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        url: URL.createObjectURL(file),
        file,
      }));

      return [...prev, ...next];
    });
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setCoords(nextCoords);

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${nextCoords.lat}&lon=${nextCoords.lng}`,
            {
              headers: {
                Accept: "application/json",
              },
            },
          );

          if (!response.ok) {
            throw new Error("Unable to detect address");
          }

          const data = await response.json();
          const location = data.address ?? {};

          const detectedArea =
            location.suburb ||
            location.neighbourhood ||
            location.city_district ||
            location.village ||
            location.town ||
            "";

          const detectedAddress =
            data.display_name ||
            [location.road, location.neighbourhood, location.suburb, location.city]
              .filter(Boolean)
              .join(", ");

          setAddress(detectedAddress);
          setArea(detectedArea);

          toast.success("Location and address detected.");
        } catch (error) {
          console.error("Reverse geocoding failed:", error);

          toast.success("Location detected, but address could not be determined.");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        setLocating(false);

        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location permission was denied. Please allow location access.");
            break;

          case error.POSITION_UNAVAILABLE:
            toast.error("Your current location is unavailable.");
            break;

          case error.TIMEOUT:
            toast.error("Location request timed out.");
            break;

          default:
            toast.error("Unable to determine your location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      },
    );
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!animal || !condition || !emergency || !coords) return;
    const animalType = animal === "Other" ? customAnimal.trim() : animal;
    if (!animalType) return;
    setSubmitting(true);
    try {
      const report = await createReport({
        animal: animalType,
        count,
        condition,
        emergency,
        description,
        contactPhone,
        address,
        area,
        images: images.length ? images.map((i) => i.url) : [],
        files: images.map((i) => i.file),
        coords,
        duplicateWarningShown: duplicateSawAndAcknowledged,
      });
      toast.success(`Report #${report.id} submitted successfully`);
      setSubmitted(report.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to submit your report.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="mx-auto max-w-lg py-10 text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="h-8 w-8" aria-hidden="true" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-foreground">Report submitted!</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your rescue request <span className="font-semibold text-foreground">#{submitted}</span>{" "}
          has been received. Rescuers in your area have been notified.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => navigate({ to: "/citizen/reports/$id", params: { id: submitted } })}
          >
            Track this report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(null);
              setStep(0);
              setAnimal(null);
              setCustomAnimal("");
              setCount(1);
              setCondition(null);
              setEmergency(null);
              setAddress("");
              setArea("");
              setCoords(null);
              setImages([]);
              setDescription("");
              setContactPhone("");
            }}
          >
            Report another animal
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Report an animal</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Give us a few details so a rescuer can reach the animal quickly.
        </p>
      </div>

      <WizardStepper steps={STEPS} current={step} />

      <div className="card-surface p-6">
        {step === 0 ? (
          <div className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-6">
                <Label className="mb-2 block">
                  Animal type <span className="text-destructive">*</span>
                </Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                  {ANIMAL_OPTIONS.map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAnimal(value)}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border p-3 text-sm font-medium transition-colors",
                        animal === value
                          ? "border-primary bg-primary-soft text-primary ring-2 ring-primary/30"
                          : "border-border hover:bg-muted",
                      )}
                      aria-pressed={animal === value}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {animal === "Other" ? (
                <div>
                  <Label className="mb-2 block" htmlFor="custom-animal">
                    Specify the animal type <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="custom-animal"
                    value={customAnimal}
                    onChange={(e) => setCustomAnimal(e.target.value)}
                    placeholder="e.g. Rabbit, Goat, or Monkey"
                    autoFocus
                  />
                </div>
              ) : null}

              <div>
                <Label className="mb-2 block" htmlFor="count">
                  Number of animals <span className="text-destructive">*</span>
                </Label>
                <div className="flex w-fit items-center gap-3 rounded-lg border border-border p-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Decrease count"
                    onClick={() => setCount((c) => Math.max(1, c - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span id="count" className="w-8 text-center text-sm font-semibold">
                    {count}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Increase count"
                    onClick={() => setCount((c) => Math.min(20, c + 1))}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">
                  Condition <span className="text-destructive">*</span>
                </Label>
                <div className="flex flex-wrap gap-2">
                  {CONDITION_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCondition(c)}
                      className={cn(
                        "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                        condition === c
                          ? "border-primary bg-primary-soft text-primary ring-2 ring-primary/30"
                          : "border-border hover:bg-muted",
                      )}
                      aria-pressed={condition === c}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <Label className="mb-2 block">
                  Emergency level <span className="text-destructive">*</span>
                </Label>
                <div className="grid gap-2 sm:grid-cols-2">
                  {EMERGENCY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setEmergency(opt.value)}
                      className={cn(
                        "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors",
                        emergency === opt.value ? opt.activeCls : opt.cls,
                      )}
                      aria-pressed={emergency === opt.value}
                    >
                      <PriorityBadge level={opt.value} />
                      <span className="text-xs text-muted-foreground">{opt.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="border-t border-border pt-6">
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-foreground">Additional details</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Add photos and details to help the rescuer identify the animal.
                </p>
              </div>

              {/* Photos */}
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
                    dragOver
                      ? "border-primary bg-primary-soft/40"
                      : "border-border hover:border-primary/50",
                  )}
                >
                  {/* Icon */}
                  <div className="flex flex-col items-center justify-center text-center">
                    <ImagePlus className="mb-2 h-7 w-7 text-muted-foreground" aria-hidden="true" />

                    <p className="text-sm font-medium">Add photos of the animal</p>

                    <p className="mt-1 text-xs text-muted-foreground">
                      Capture a live photo or upload existing photos
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                    {/* Take Photo */}
                    <Button
                      type="button"
                      variant="default"
                      disabled={images.length >= 6}
                      onClick={openCamera}
                      className="gap-2"
                    >
                      <Camera className="h-4 w-4" aria-hidden="true" />
                      Take Photo
                    </Button>

                    {cameraOpen && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
                        <div className="w-full max-w-2xl overflow-hidden rounded-2xl bg-background shadow-2xl">
                          {/* Header */}
                          <div className="flex items-center justify-between border-b border-border px-4 py-3">
                            <div>
                              <h2 className="text-base font-semibold">Take Animal Photo</h2>

                              <p className="text-xs text-muted-foreground">
                                Position the animal inside the camera frame
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={closeCamera}
                              className="grid h-9 w-9 place-items-center rounded-full hover:bg-muted"
                              aria-label="Close camera"
                            >
                              <X className="h-5 w-5" />
                            </button>
                          </div>

                          {/* Camera */}
                          <div className="relative aspect-video w-full bg-black">
                            <video
                              ref={videoRef}
                              autoPlay
                              playsInline
                              muted
                              className="h-full w-full object-cover"
                            />

                            {/* Camera frame */}
                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                              <div className="h-3/4 w-3/4 rounded-2xl border-2 border-white/70" />
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center justify-center gap-4 px-4 py-5">
                            <Button type="button" variant="outline" onClick={closeCamera}>
                              Cancel
                            </Button>

                            <Button
                              type="button"
                              onClick={capturePhoto}
                              disabled={images.length >= 6}
                              className="gap-2"
                            >
                              <Camera className="h-4 w-4" />
                              Capture Photo
                            </Button>
                          </div>
                        </div>

                        <canvas ref={canvasRef} className="hidden" />
                      </div>
                    )}

                    {/* Upload Photos */}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={images.length >= 6}
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      Upload Photos
                    </Button>
                  </div>

                  {/* Drag & Drop text */}
                  <p className="mt-4 text-center text-xs text-muted-foreground">
                    You can also drag & drop photos here
                  </p>

                  <p className="mt-1 text-center text-xs text-muted-foreground">
                    {images.length}/6 photos added
                  </p>

                  {/* Normal Upload Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);

                      // Allow selecting the same file again later
                      e.target.value = "";
                    }}
                  />

                  {/* Camera Input */}
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files);

                      // Allow capturing another photo after deleting/reselecting
                      e.target.value = "";
                    }}
                  />
                </div>

                {/* Image Preview */}
                {/* Image Preview */}
                {images.length > 0 && (
                  <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                    {images.map((img) => (
                      <div
                        key={img.id}
                        className="group relative aspect-square overflow-hidden rounded-lg border border-border"
                      >
                        {/* Clickable image */}
                        <button
                          type="button"
                          onClick={() => setPreviewImage(img.url)}
                          className="h-full w-full cursor-zoom-in"
                          aria-label="View uploaded animal photo"
                        >
                          <img
                            src={img.url}
                            alt="Uploaded animal"
                            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
                          />
                        </button>

                        {/* Remove button */}
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
                    {/* Close button */}
                    <button
                      type="button"
                      onClick={() => setPreviewImage(null)}
                      className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
                      aria-label="Close image preview"
                    >
                      <X className="h-6 w-6" />
                    </button>

                    {/* Full image */}
                    <img
                      src={previewImage}
                      alt="Full size animal preview"
                      className="max-h-[90vh] max-w-[95vw] rounded-lg object-contain shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="mt-5">
                <Label className="mb-2 block" htmlFor="description">
                  Description <span className="text-muted-foreground">(optional)</span>
                </Label>

                <Textarea
                  id="description"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the animal, its condition, exact spot, landmarks, or anything that may help the rescuer..."
                />
              </div>

              {/* Contact */}
              <div className="mt-5 sm:max-w-sm">
                <Label className="mb-2 block" htmlFor="phone">
                  Contact number <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="phone"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+91 90000 00000"
                />
              </div>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block" htmlFor="address">
                  Address <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address will be detected automatically"
                />
              </div>

              <div>
                <Label className="mb-2 block" htmlFor="area">
                  Area <span className="text-destructive">*</span>
                </Label>

                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Area will be detected automatically"
                />
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Locate className="h-4 w-4" aria-hidden="true" />
              )}

              {locating ? "Detecting location..." : "Use my current location"}
            </Button>

            <MapView
              height="h-[320px]"
              markers={
                coords
                  ? [
                      {
                        id: "animal-location",
                        label: "Animal location",
                        sub: address || "Reported location",
                        coords,
                        kind: "you",
                      },
                    ]
                  : []
              }
              onSelect={() => {}}
              caption={
                coords
                  ? `Animal location: ${coords.lat.toFixed(6)}, ${coords.lng.toFixed(6)}`
                  : "Use your current location to place the animal marker"
              }
            />

            {!coords ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Use your current location to place the animal report.
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                The animal report will be saved at this exact GPS location.
              </p>
            )}

            {errors[1] ? <p className="text-sm text-destructive">{errors[1]}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Review your report</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>
                <dd className="text-sm font-medium text-foreground">
                  {count} × {animal === "Other" ? customAnimal : animal}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Condition</dt>
                <dd className="text-sm font-medium text-foreground">{condition}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Emergency</dt>
                <dd>{emergency ? <PriorityBadge level={emergency} /> : "—"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Location</dt>
                <dd className="text-sm font-medium text-foreground">
                  {address}, {area}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs font-semibold uppercase text-muted-foreground">
                  Description
                </dt>
                <dd className="text-sm text-foreground">{description || "—"}</dd>
              </div>
            </dl>
            {images.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {images.map((img) => (
                  <img
                    key={img.id}
                    src={img.url}
                    alt="Uploaded animal"
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            onClick={() => {
              if (step === 1) {
                void checkForDuplicates();
              } else if (canProceed) {
                setStep((s) => s + 1);
              }
            }}
            disabled={!canProceed || checkingDuplicates}
          >
            {checkingDuplicates ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" aria-hidden="true" />
            ) : null}
            Next
          </Button>
        ) : (
          <Button onClick={() => void handleSubmit()} disabled={submitting || !canProceed}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Submit report
          </Button>
        )}
      </div>

      <DuplicateWarningDialog
        open={duplicateWarningOpen}
        onOpenChange={setDuplicateWarningOpen}
        matches={duplicateResult?.matches ?? []}
        onContinue={handleDuplicateContinue}
        onCancel={handleDuplicateCancel}
        isSubmitting={checkingDuplicates}
      />
    </div>
  );
}
