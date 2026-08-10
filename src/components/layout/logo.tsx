import { Link } from "@tanstack/react-router";
import { PawPrint } from "lucide-react";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      to="/"
      className="flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      aria-label="ResQ Paws home"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
        <PawPrint className="h-5 w-5" aria-hidden="true" />
      </span>
      {!compact ? (
        <span className="min-w-0">
          <span className="block truncate font-display text-base leading-tight font-bold text-foreground">
            ResQ Paws
          </span>
          <span className="block truncate text-[11px] leading-tight text-muted-foreground">
            Report. Rescue. Recover.
          </span>
        </span>
      ) : null}
    </Link>
  );
}