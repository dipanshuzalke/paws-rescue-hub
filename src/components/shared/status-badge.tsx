import {
  AlertTriangle,
  ArrowUpRight,
  Ban,
  CheckCircle2,
  CircleDot,
  Clock,
  Flame,
  Info,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Emergency, RescueStatus, UserStatus } from "@/types";

const base =
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold whitespace-nowrap";

const statusMap: Record<RescueStatus, { label: string; icon: LucideIcon; cls: string }> = {
  REPORTED: {
    label: "Reported",
    icon: CircleDot,
    cls: "border-info/25 bg-info-soft text-info",
  },
  ASSIGNED: {
    label: "Assigned",
    icon: UserCheck,
    cls: "border-primary/25 bg-primary-soft text-primary",
  },
  ACCEPTED: {
    label: "Accepted",
    icon: CheckCircle2,
    cls: "border-primary/25 bg-primary-soft text-primary",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Truck,
    cls: "border-warning/30 bg-warning-soft text-warning-foreground",
  },
  RESCUED: {
    label: "Rescued",
    icon: ShieldCheck,
    cls: "border-success/25 bg-success-soft text-success",
  },
  CLOSED: {
    label: "Closed",
    icon: CheckCircle2,
    cls: "border-border bg-muted text-muted-foreground",
  },
  CANCELLED: {
    label: "Cancelled",
    icon: Ban,
    cls: "border-border bg-muted text-muted-foreground",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: RescueStatus;
  className?: string;
}) {
  const meta = statusMap[status];
  const Icon = meta.icon;
  return (
    <span className={cn(base, meta.cls, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {meta.label}
    </span>
  );
}

const emergencyMap: Record<Emergency, { icon: LucideIcon; cls: string }> = {
  CRITICAL: { icon: Flame, cls: "border-critical/30 bg-critical-soft text-critical" },
  HIGH: {
    icon: AlertTriangle,
    cls: "border-warning/35 bg-warning-soft text-warning-foreground",
  },
  MEDIUM: {
    icon: ArrowUpRight,
    cls: "border-caution/40 bg-caution-soft text-caution-foreground",
  },
  LOW: { icon: Info, cls: "border-info/25 bg-info-soft text-info" },
};

const titleCase = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();

export function PriorityBadge({
  level,
  className,
}: {
  level: Emergency;
  className?: string;
}) {
  const meta = emergencyMap[level];
  const Icon = meta.icon;
  return (
    <span className={cn(base, meta.cls, className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {titleCase(level)}
    </span>
  );
}

const userStatusMap: Record<UserStatus, string> = {
  ACTIVE: "border-success/25 bg-success-soft text-success",
  VERIFIED: "border-success/25 bg-success-soft text-success",
  PENDING: "border-caution/40 bg-caution-soft text-caution-foreground",
  INACTIVE: "border-border bg-muted text-muted-foreground",
  REJECTED: "border-critical/30 bg-critical-soft text-critical",
};

export function UserStatusBadge({
  status,
  className,
}: {
  status: UserStatus;
  className?: string;
}) {
  const Icon =
    status === "ACTIVE" || status === "VERIFIED"
      ? CheckCircle2
      : status === "PENDING"
        ? Clock
        : status === "REJECTED"
          ? Ban
          : CircleDot;
  return (
    <span className={cn(base, userStatusMap[status], className)}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      {titleCase(status)}
    </span>
  );
}

export function AvailabilityBadge({ value }: { value: "Available" | "Busy" | "Offline" }) {
  const cls =
    value === "Available"
      ? "border-success/25 bg-success-soft text-success"
      : value === "Busy"
        ? "border-warning/30 bg-warning-soft text-warning-foreground"
        : "border-border bg-muted text-muted-foreground";
  return (
    <span className={cn(base, cls)}>
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          value === "Available"
            ? "bg-success"
            : value === "Busy"
              ? "bg-warning"
              : "bg-muted-foreground",
        )}
        aria-hidden="true"
      />
      {value}
    </span>
  );
}