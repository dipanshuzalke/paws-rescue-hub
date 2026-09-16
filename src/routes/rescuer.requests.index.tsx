import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, MapPin, Navigation, PawPrint, X } from "lucide-react";
import { useMemo, useState } from "react";

import { calculateDistanceKm, useLiveLocation } from "@/hooks/useLiveLocation";
import { toast } from "sonner";

import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterBar, FilterSelect } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { AnimalType, Emergency } from "@/types";

export const Route = createFileRoute("/rescuer/requests/")({
  head: () => ({
    meta: [
      { title: "Available Requests · ResQ Paws" },
      {
        name: "description",
        content: "Browse and accept nearby rescue requests waiting for a rescuer.",
      },
      { property: "og:title", content: "Available Requests · ResQ Paws" },
      {
        property: "og:description",
        content: "Browse and accept nearby rescue requests waiting for a rescuer.",
      },
    ],
  }),
  component: RescuerRequests,
});

const emergencyOptions: { value: Emergency; label: string }[] = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const animalOptions: { value: AnimalType; label: string }[] = [
  { value: "Dog", label: "Dog" },
  { value: "Cat", label: "Cat" },
  { value: "Cow", label: "Cow" },
  { value: "Bird", label: "Bird" },
  { value: "Other", label: "Other" },
];

const emergencyOrder: Record<Emergency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function RescuerRequests() {
  const { reports, updateStatus, user } = useApp();
  const { location: rescuerLocation } = useLiveLocation(user?.role === "rescuer");
  const [emergency, setEmergency] = useState("all");
  const [animal, setAnimal] = useState("all");
  const [maxDistance, setMaxDistance] = useState("all");
  const [sort, setSort] = useState<"emergency" | "distance" | "recent">("emergency");
  const [hidden, setHidden] = useState<string[]>([]);
  const [declining, setDeclining] = useState<string | null>(null);

  const available = useMemo(
    () =>
      reports
        .filter(
          (r) => (r.status === "REPORTED" || r.status === "ASSIGNED") && !hidden.includes(r.id),
        )
        .map((r) => ({
          ...r,
          liveDistanceKm: rescuerLocation ? calculateDistanceKm(rescuerLocation, r.coords) : null,
        })),
    [reports, hidden, rescuerLocation],
  );

  const filtered = useMemo(() => {
    let list = available.filter((r) => {
      if (emergency !== "all" && r.emergency !== emergency) return false;
      if (animal !== "all" && r.animal !== animal) return false;
      if (
        maxDistance !== "all" &&
        (r.liveDistanceKm === null || r.liveDistanceKm > Number(maxDistance))
      ) {
        return false;
      }
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sort === "distance") {
        if (a.liveDistanceKm === null) return 1;
        if (b.liveDistanceKm === null) return -1;
        return a.liveDistanceKm - b.liveDistanceKm;
      }
      if (sort === "recent")
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (
        emergencyOrder[a.emergency] - emergencyOrder[b.emergency] ||
        (a.liveDistanceKm ?? Infinity) - (b.liveDistanceKm ?? Infinity)
      );
    });
    return list;
  }, [available, emergency, animal, maxDistance, sort]);

  const handleAccept = (id: string) => {
    updateStatus(id, "ACCEPTED", `Accepted by ${user?.name ?? "rescuer"}.`);
    toast.success("Request accepted. Head to the location safely.");
  };

  const handleDecline = () => {
    if (!declining) return;
    setHidden((prev) => [...prev, declining]);
    setDeclining(null);
    toast("Request declined and removed from your list.");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Available Requests"
        description="Accept nearby rescue requests that match your availability."
      />

      <FilterBar>
        <FilterSelect
          value={emergency}
          onChange={setEmergency}
          options={emergencyOptions}
          label="Emergency"
          allLabel="All emergencies"
        />
        <FilterSelect
          value={animal}
          onChange={setAnimal}
          options={animalOptions}
          label="Animal"
          allLabel="All animals"
        />
        <FilterSelect
          value={maxDistance}
          onChange={setMaxDistance}
          options={[
            { value: "2", label: "Within 2 km" },
            { value: "5", label: "Within 5 km" },
            { value: "10", label: "Within 10 km" },
          ]}
          label="Distance"
          allLabel="Any distance"
        />
        <FilterSelect
          value={sort}
          onChange={(v) => setSort(v as typeof sort)}
          options={[
            { value: "emergency", label: "Emergency" },
            { value: "distance", label: "Distance" },
            { value: "recent", label: "Most recent" },
          ]}
          label="Sort by"
          allLabel="Sort: Emergency"
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title="No matching requests"
          description="Try widening your filters or check back shortly."
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <li key={r.id} className="card-surface flex flex-col gap-3 p-4">
              <Link
                to="/rescuer/requests/$id"
                params={{ id: r.id }}
                className="flex flex-col gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex gap-3">
                  <img
                    src={r.images[0]}
                    alt={`${r.condition} ${r.animal.toLowerCase()} in ${r.area}`}
                    className="h-20 w-20 shrink-0 rounded-lg object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">{r.title}</h3>
                      <PriorityBadge level={r.emergency} />
                    </div>
                    <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                      {r.area}, {r.city}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Navigation className="h-3 w-3" aria-hidden="true" />
                        {r.liveDistanceKm !== null
                          ? `${r.liveDistanceKm.toFixed(1)} km`
                          : "Getting location..."}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {timeAgo(r.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <PawPrint className="h-3 w-3" aria-hidden="true" />
                        {r.animal}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="flex gap-2 border-t border-border pt-3">
                <Button className="flex-1" onClick={() => handleAccept(r.id)}>
                  Accept
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setDeclining(r.id)}>
                  <X className="h-4 w-4" aria-hidden="true" />
                  Decline
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={Boolean(declining)}
        onOpenChange={(v) => !v && setDeclining(null)}
        title="Decline this request?"
        description="It will be removed from your list of available requests. Other rescuers will still be able to accept it."
        confirmLabel="Decline"
        destructive
        onConfirm={handleDecline}
      />
    </div>
  );
}
