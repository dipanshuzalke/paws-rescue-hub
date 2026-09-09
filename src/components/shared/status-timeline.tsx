import { Check, Circle, Loader2 } from "lucide-react";

import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TimelineEntry } from "@/types";

export function StatusTimeline({
  entries,
  compact = false,
}: {
  entries: TimelineEntry[];
  compact?: boolean;
}) {
  const currentIndex = entries.reduce((acc, e, i) => (e.at ? i : acc), -1);

  return (
    <ol className="relative space-y-0">
      {entries.map((entry, i) => {
        const isClosed =
          entry.status.toUpperCase() === "CLOSED" || entry.label.toUpperCase() === "CLOSED";

        const done = Boolean(entry.at) && (i < currentIndex || (isClosed && i === currentIndex));

        const current = i === currentIndex && !isClosed;

        const last = i === entries.length - 1;

        return (
          <li key={entry.status} className="relative flex gap-3 pb-5 last:pb-0">
            {!last ? (
              <span
                aria-hidden="true"
                className={cn(
                  "absolute top-7 left-[13px] h-[calc(100%-1.25rem)] w-px",
                  done || current ? "bg-primary/40" : "bg-border",
                )}
              />
            ) : null}

            <span
              className={cn(
                "relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border-2 transition-colors",
                done && "border-success bg-success text-success-foreground",
                current && "border-primary bg-primary text-primary-foreground",
                !done && !current && "border-border bg-card text-muted-foreground",
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5" aria-hidden="true" />
              ) : current ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Circle className="h-2 w-2" aria-hidden="true" />
              )}
            </span>

            <div className="min-w-0 pt-0.5">
              <p
                className={cn(
                  "text-sm font-semibold",
                  done || current ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {entry.label}

                {current ? (
                  <span className="ml-2 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
                    Current
                  </span>
                ) : null}
              </p>

              {entry.at ? (
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(entry.at)}
                  {entry.by && !compact ? ` · ${entry.by}` : ""}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">Pending</p>
              )}

              {entry.note ? (
                <p className="mt-1 text-xs text-muted-foreground">{entry.note}</p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
