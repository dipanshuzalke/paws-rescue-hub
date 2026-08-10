import { Bird, Cat, Dog, HelpCircle, Beef } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AnimalType, Condition, Emergency } from "@/types";

export const ANIMAL_OPTIONS: { value: AnimalType; label: string; icon: LucideIcon }[] = [
  { value: "Dog", label: "Dog", icon: Dog },
  { value: "Cat", label: "Cat", icon: Cat },
  { value: "Cow", label: "Cow", icon: Beef },
  { value: "Bird", label: "Bird", icon: Bird },
  { value: "Other", label: "Other", icon: HelpCircle },
];

export const CONDITION_OPTIONS: Condition[] = [
  "Injured",
  "Sick",
  "Abandoned",
  "Trapped",
  "Accident",
  "Other",
];

export const EMERGENCY_OPTIONS: {
  value: Emergency;
  label: string;
  hint: string;
  cls: string;
  activeCls: string;
}[] = [
  {
    value: "CRITICAL",
    label: "Critical",
    hint: "Life-threatening, needs help now",
    cls: "border-critical/25 hover:bg-critical-soft/60",
    activeCls: "border-critical bg-critical-soft text-critical ring-2 ring-critical/30",
  },
  {
    value: "HIGH",
    label: "High",
    hint: "Serious injury or distress",
    cls: "border-warning/30 hover:bg-warning-soft/60",
    activeCls: "border-warning bg-warning-soft text-warning-foreground ring-2 ring-warning/30",
  },
  {
    value: "MEDIUM",
    label: "Medium",
    hint: "Needs attention soon",
    cls: "border-caution/40 hover:bg-caution-soft/60",
    activeCls: "border-caution bg-caution-soft text-caution-foreground ring-2 ring-caution/30",
  },
  {
    value: "LOW",
    label: "Low",
    hint: "Stable, non-urgent",
    cls: "border-info/25 hover:bg-info-soft/60",
    activeCls: "border-info bg-info-soft text-info ring-2 ring-info/30",
  },
];

export function WizardStepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <ol className="flex items-center gap-2 overflow-x-auto pb-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex shrink-0 items-center gap-2">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 text-xs font-bold",
                  done && "border-success bg-success text-success-foreground",
                  active && "border-primary bg-primary text-primary-foreground",
                  !done && !active && "border-border bg-card text-muted-foreground",
                )}
              >
                {i + 1}
              </span>
              <span
                className={cn(
                  "text-sm font-semibold whitespace-nowrap",
                  active ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 ? (
              <span className="h-px w-8 shrink-0 bg-border sm:w-12" aria-hidden="true" />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
