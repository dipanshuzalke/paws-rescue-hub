import { Link } from "@tanstack/react-router";
import { Clock, MapPin, Navigation } from "lucide-react";
import type { ReactNode } from "react";

import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { RescueReport } from "@/types";

export function CaseCard({
  report,
  to,
  params,
  footer,
  showDistance = false,
}: {
  report: RescueReport;
  to?: string | undefined;
  params?: Record<string, string> | undefined;
  footer?: ReactNode | undefined;
  showDistance?: boolean | undefined;
}) {
  const { user } = useApp();
  const body = (
    <>
      <div className="relative aspect-[16/10] overflow-hidden rounded-lg bg-muted">
        <img
          src={report.images[0]}
          alt={`${report.condition} ${report.animal.toLowerCase()} reported in ${report.area}`}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
          <PriorityBadge level={report.emergency} />
        </div>
      </div>
      <div className="mt-4 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <h3 className="truncate text-base font-semibold text-foreground">{report.title}</h3>
          <span className="shrink-0 text-xs font-medium text-muted-foreground">#{report.id}</span>
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">
            {report.area}, {report.city}
          </span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusBadge status={report.status} />
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" aria-hidden="true" />
            {timeAgo(report.createdAt)}
          </span>
          {showDistance ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-foreground">
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              {report.distanceKm} km away
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  return (
    <article className="card-surface group flex flex-col p-4 transition-shadow hover:shadow-[var(--shadow-pop)]">
      {to && user ? (
        <Link
          to={to}
          params={params ?? {}}
          className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          {body}
        </Link>
      ) : to ? (
        <Link to="/login" className="rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
          {body}
        </Link>
      ) : (
        body
      )}
      {footer ? <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">{footer}</div> : null}
    </article>
  );
}