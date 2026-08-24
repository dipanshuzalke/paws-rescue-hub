import { createFileRoute } from "@tanstack/react-router";
import { Mail, MapPin, Phone, Star, Timer } from "lucide-react";
import { useMemo, useState } from "react";

import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { AvailabilityBadge } from "@/components/shared/status-badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { mockRescuers } from "@/data/mockUsers";
import { useAsync } from "@/hooks/use-async";
import { initials } from "@/lib/format";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";
import type { Rescuer } from "@/types";

export const Route = createFileRoute("/ngo/rescuers")({
  head: () => ({
    meta: [
      { title: "Team Roster · ResQ Paws" },
      { name: "description", content: "Manage your rescuer team's availability and performance." },
      { property: "og:title", content: "Team Roster · ResQ Paws" },
      {
        property: "og:description",
        content: "Browse rescuer availability, active cases and completed rescues.",
      },
    ],
  }),
  component: NgoRescuers,
});

function NgoRescuers() {
  const { apiMode } = useApp();
  const { data, loading } = useAsync(
    () =>
      apiMode
        ? ngoService.getRescuers({ limit: 100 }).then((r) => r.items)
        : Promise.resolve(mockRescuers),
    [apiMode],
  );
  const rescuers = data ?? [];

  const [search, setSearch] = useState("");
  const [availability, setAvailability] = useState("all");
  const [detail, setDetail] = useState<Rescuer | null>(null);

  const filtered = useMemo(
    () =>
      rescuers.filter((r) => {
        if (availability !== "all" && r.availability !== availability) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          r.name.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
        );
      }),
    [rescuers, search, availability],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Team roster"
        description={`${filtered.length} rescuer${filtered.length === 1 ? "" : "s"} in your network.`}
      />

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or area…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={availability}
          onChange={setAvailability}
          label="Availability"
          options={[
            { value: "Available", label: "Available" },
            { value: "Busy", label: "Busy" },
            { value: "Offline", label: "Offline" },
          ]}
        />
      </FilterBar>

      {loading ? null : filtered.length === 0 ? (
        <EmptyState title="No rescuers found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setDetail(r)}
              className="card-surface flex flex-col gap-3 p-4 text-left transition-shadow hover:shadow-[var(--shadow-pop)]"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarFallback>{initials(r.name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.organization ?? "Independent"}
                    </p>
                  </div>
                </div>
                <AvailabilityBadge value={r.availability} />
              </div>

              <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-2 text-center">
                <div>
                  <p className="text-sm font-bold text-foreground">{r.activeCases}</p>
                  <p className="text-[11px] text-muted-foreground">Active</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.completedCases}</p>
                  <p className="text-[11px] text-muted-foreground">Completed</p>
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{r.distanceKm} km</p>
                  <p className="text-[11px] text-muted-foreground">Distance</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-caution text-caution" aria-hidden="true" />
                  {r.rating.toFixed(1)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Timer className="h-3.5 w-3.5" aria-hidden="true" />
                  {r.avgResponseMins}m avg
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent>
          {detail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(detail.name)}</AvatarFallback>
                  </Avatar>
                  {detail.name}
                </DialogTitle>
                <DialogDescription>{detail.organization ?? "Independent rescuer"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Availability</span>
                  <AvailabilityBadge value={detail.availability} />
                </div>
                <p className="flex items-center gap-2 text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> {detail.email}
                </p>
                <p className="flex items-center gap-2 text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> {detail.phone}
                </p>
                <p className="flex items-center gap-2 text-foreground">
                  <MapPin className="h-4 w-4 text-muted-foreground" aria-hidden="true" /> {detail.location}
                </p>
                <div className="grid grid-cols-3 gap-2 rounded-lg border border-border p-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-foreground">{detail.activeCases}</p>
                    <p className="text-xs text-muted-foreground">Active cases</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{detail.completedCases}</p>
                    <p className="text-xs text-muted-foreground">Completed</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{detail.distanceKm} km</p>
                    <p className="text-xs text-muted-foreground">Distance</p>
                  </div>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
