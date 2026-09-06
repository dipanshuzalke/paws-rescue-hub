import { CheckCircle2, ClipboardList, Truck, UserCheck, Users, Building2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityEntry } from "@/types";

const kindMeta: Record<ActivityEntry["kind"], { icon: LucideIcon; cls: string }> = {
  report: { icon: ClipboardList, cls: "bg-info-soft text-info" },
  assign: { icon: UserCheck, cls: "bg-primary-soft text-primary" },
  accept: { icon: CheckCircle2, cls: "bg-success-soft text-success" },
  rescue: { icon: Truck, cls: "bg-warning-soft text-warning-foreground" },
  user: { icon: Users, cls: "bg-muted text-muted-foreground" },
  ngo: { icon: Building2, cls: "bg-caution-soft text-caution-foreground" },
};

export function ActivityList({
  entries,
  className,
}: {
  entries: ActivityEntry[];
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-border", className)}>
      {entries.map((entry) => {
        const meta = kindMeta[entry.kind] ?? kindMeta.report;
        const Icon = meta.icon;
        return (
          <li key={entry.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
            <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full", meta.cls)}>
              <Icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1 overflow-hidden">
              <p className="break-words text-sm text-foreground [overflow-wrap:anywhere]">
                <span className="font-semibold">{entry.actor}</span> {entry.action}{" "}
                <span className="font-semibold">{entry.target}</span>
              </p>
              <p className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">{timeAgo(entry.at)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
