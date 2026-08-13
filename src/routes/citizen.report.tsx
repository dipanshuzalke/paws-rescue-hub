import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import {
  CheckCircle2,
  ImagePlus,
  Loader2,
  Locate,
  MapPin,
  Minus,
  Plus,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  ANIMAL_OPTIONS,
  CONDITION_OPTIONS,
  EMERGENCY_OPTIONS,
  WizardStepper,
} from "@/components/citizen/report-wizard-steps";
import { MapView } from "@/components/maps/map-view";
import { PriorityBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";
import type { AnimalType, Condition, Emergency } from "@/types";

export const Route = createFileRoute("/citizen/report")({
  head: () => ({
    meta: [
      { title: "Report an Animal · ResQ Paws" },
      { name: "description", content: "Report a stray or injured animal in a few quick steps." },
      { property: "og:title", content: "Report an Animal · ResQ Paws" },
      { property: "og:description", content: "Report a stray or injured animal in a few quick steps." },
    ],
  }),
  component: CitizenReport,
});

const STEPS = ["Animal details", "Location", "Photos", "Review & submit"];

interface WizardImage {
  id: string;
  url: string;
  file: File;
}

function CitizenReport() {
  const { createReport } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState<string | null>(null);

  const [animal, setAnimal] = useState<AnimalType | null>(null);
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

  const errors: Partial<Record<number, string>> = {};
  if (step === 0 && (!animal || !condition || !emergency)) {
    errors[0] = "Select the animal type, condition and emergency level to continue.";
  }
  if (step === 1 && (!address.trim() || !area.trim() || !coords)) {
    errors[1] = "Add an address, area and location to continue.";
  }

  const canProceed = step === 0 ? !errors[0] : step === 1 ? !errors[1] : true;

  const addFiles = (files: FileList | null) => {
    if (!files) return;
    const next: WizardImage[] = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .map((f) => ({ id: `${f.name}-${Date.now()}-${Math.random()}`, url: URL.createObjectURL(f), file: f }));
    setImages((prev) => [...prev, ...next].slice(0, 6));
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((i) => i.id === id);
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((i) => i.id !== id);
    });
  };

  const useCurrentLocation = () => {
    setLocating(true);
    setTimeout(() => {
      const mockCoords = { lat: 21.1385 + (Math.random() - 0.5) * 0.02, lng: 79.0625 + (Math.random() - 0.5) * 0.02 };
      setCoords(mockCoords);
      if (!address) setAddress("Near Shankar Nagar Square");
      if (!area) setArea("Dharampeth");
      setLocating(false);
      toast.success("Location detected");
    }, 800);
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!animal || !condition || !emergency || !coords) return;
    setSubmitting(true);
    try {
      const report = await createReport({
        animal,
        count,
        condition,
        emergency,
        description,
        address,
        area,
        images: images.length ? images.map((i) => i.url) : [],
        files: images.map((i) => i.file),
        coords,
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
          Your rescue request <span className="font-semibold text-foreground">#{submitted}</span> has been
          received. Rescuers in your area have been notified.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button onClick={() => navigate({ to: "/citizen/reports/$id", params: { id: submitted } })}>
            Track this report
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSubmitted(null);
              setStep(0);
              setAnimal(null);
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
            <div>
              <Label className="mb-2 block">Animal type</Label>
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

            <div>
              <Label className="mb-2 block" htmlFor="count">
                Number of animals
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
              <Label className="mb-2 block">Condition</Label>
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
              <Label className="mb-2 block">Emergency level</Label>
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
            {errors[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null}
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block" htmlFor="address">
                  Address
                </Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Near Shankar Nagar Square"
                />
              </div>
              <div>
                <Label className="mb-2 block" htmlFor="area">
                  Area
                </Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="e.g. Dharampeth"
                />
              </div>
            </div>
            <Button type="button" variant="outline" onClick={useCurrentLocation} disabled={locating}>
              {locating ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Locate className="h-4 w-4" aria-hidden="true" />
              )}
              Use my current location
            </Button>
            <MapView
              height="h-[280px]"
              markers={
                coords
                  ? [{ id: "pin", label: address || "Selected location", coords, kind: "you" }]
                  : []
              }
              onSelect={() => {
                if (!coords) useCurrentLocation();
              }}
              caption={
                coords
                  ? `Pin set at ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`
                  : "Tap “Use my current location” to drop a pin"
              }
            />
            {!coords ? (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                No location selected yet.
              </p>
            ) : null}
            {errors[1] ? <p className="text-sm text-destructive">{errors[1]}</p> : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-5">
            <div>
              <Label className="mb-2 block">Photos (optional but recommended)</Label>
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
                  "flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
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
                <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {images.map((img) => (
                    <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-border">
                      <img src={img.url} alt="Uploaded animal" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        aria-label="Remove photo"
                        onClick={() => removeImage(img.id)}
                        className="absolute top-1 right-1 grid h-6 w-6 place-items-center rounded-full bg-foreground/70 text-background"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div>
              <Label className="mb-2 block" htmlFor="description">
                Description (optional)
              </Label>
              <Textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Any details that could help the rescuer, e.g. behaviour, exact spot, landmarks..."
              />
            </div>
            <div className="sm:w-1/2">
              <Label className="mb-2 block" htmlFor="phone">
                Contact number (optional)
              </Label>
              <Input
                id="phone"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 90000 00000"
              />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="space-y-5">
            <h2 className="font-display text-lg font-bold text-foreground">Review your report</h2>
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Animal</dt>
                <dd className="text-sm font-medium text-foreground">
                  {count} × {animal}
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
                <dt className="text-xs font-semibold uppercase text-muted-foreground">Description</dt>
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
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          Back
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => canProceed && setStep((s) => s + 1)} disabled={!canProceed}>
            Next
          </Button>
        ) : (
          <Button onClick={handleSubmit}>Submit report</Button>
        )}
      </div>
    </div>
  );
}
