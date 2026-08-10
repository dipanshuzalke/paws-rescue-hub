import type { LucideIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type StatTone = "primary" | "success" | "warning" | "critical" | "info" | "neutral";

const toneMap: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success-soft text-success",
  warning: "bg-warning-soft text-warning-foreground",
  critical: "bg-critical-soft text-critical",
  info: "bg-info-soft text-info",
  neutral: "bg-muted text-muted-foreground",
};

export function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0);
  const raf = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(Math.round(target * eased));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration]);

  return value;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  tone = "primary",
  hint,
  animate = true,
}: {
  label: string;
  value: number | string;
  icon?: LucideIcon;
  tone?: StatTone;
  hint?: string;
  animate?: boolean;
}) {
  const numeric = typeof value === "number" ? value : null;
  const counted = useCountUp(numeric ?? 0);
  const shown = numeric === null ? value : animate ? counted : numeric;

  return (
    <div className="card-surface group p-5 transition-shadow hover:shadow-[var(--shadow-pop)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl leading-none font-bold text-foreground">
            {shown}
          </p>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {Icon ? (
          <span
            className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", toneMap[tone])}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </div>
  );
}