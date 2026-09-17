import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { AssignDialog } from "@/components/ngo/assign-dialog";
import { MapView } from "@/components/maps/map-view";
import { CaseCard } from "@/components/rescue/case-card";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader, SectionHeading } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { useApp } from "@/store/app-store";
import type { RescueReport, RescueStatus } from "@/types";
import { useAvailableRescuersLocation } from "@/hooks/useAvailableResquer";

export const Route = createFileRoute("/ngo/active")({
  head: () => ({
    meta: [
      { title: "Active Rescues · ResQ Paws" },
      { name: "description", content: "Track every rescue currently assigned or in progress." },
      { property: "og:title", content: "Active Rescues · ResQ Paws" },
      {
        property: "og:description",
        content: "Monitor active rescue cases on a live map alongside case details.",
      },
    ],
  }),
  component: NgoActive,
});

const activeStatuses: RescueStatus[] = ["ASSIGNED", "ACCEPTED", "IN_PROGRESS"];

function NgoActive() {
  const { reports } = useApp();
  const availableRescuerLocations =
  useAvailableRescuersLocation();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [assignTarget, setAssignTarget] = useState<RescueReport | null>(null);

  const active = useMemo(
    () => reports.filter((r) => activeStatuses.includes(r.status)),
    [reports],
  );

  const filtered = useMemo(
    () =>
      active.filter((r) => {
        if (status !== "all" && r.status !== status) return false;
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          r.title.toLowerCase().includes(q) ||
          r.area.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.rescuerName ?? "").toLowerCase().includes(q)
        );
      }),
    [active, search, status],
  );

  const activeCaseMarkers = active.map((r) => ({
  id: r.id,
  label: `#${r.id} · ${r.title}`,
  sub: `${r.area}, ${r.city}${r.rescuerName ? ` · ${r.rescuerName}` : ""}`,
  coords: r.coords,
  emergency: r.emergency,
  kind: "request" as const,
}));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Active rescues"
        description={`${filtered.length} rescue${filtered.length === 1 ? "" : "s"} currently underway.`}
      />

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by case, area or rescuer…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={activeStatuses.map((s) => ({ value: s, label: s.replace("_", " ") }))}
        />
      </FilterBar>

      <div className="card-surface p-5">
        <SectionHeading title="Live map" description="Locations of all active rescue cases." />
        <MapView
    markers={activeCaseMarkers}
    availableRescuerLocations={availableRescuerLocations}
    activeId={activeId}
    onSelect={setActiveId}
    height="h-[420px]"
    showNavigation={false}
  />
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="No active rescues" description="Assigned and in-progress cases will show up here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <CaseCard
              key={r.id}
              report={r}
              to="/ngo/requests/$id"
              params={{ id: r.id }}
              footer={
                <>
                  {r.rescuerName ? (
                    <span className="text-xs font-medium text-primary">{r.rescuerName}</span>
                  ) : null}
                  <div className="ml-auto flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link to="/ngo/requests/$id" params={{ id: r.id }}>
                        View
                      </Link>
                    </Button>
                    <Button size="sm" onClick={() => setAssignTarget(r)}>
                      Reassign
                    </Button>
                  </div>
                </>
              }
            />
          ))}
        </div>
      )}

      <AssignDialog
        report={assignTarget}
        open={!!assignTarget}
        onOpenChange={(v) => !v && setAssignTarget(null)}
      />
    </div>
  );
}
