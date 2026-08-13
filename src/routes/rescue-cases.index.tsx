import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { PublicShell } from "@/components/layout/public-shell";
import { CaseCard } from "@/components/rescue/case-card";
import { EmptyState } from "@/components/shared/states";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { ErrorState, TableSkeleton } from "@/components/shared/states";
import { mockReports } from "@/data/mockReports";
import { useAsync } from "@/hooks/use-async";
import { isApiEnabled } from "@/lib/api-client";
import { publicService } from "@/services/publicService";

export const Route = createFileRoute("/rescue-cases/")({
  head: () => ({
    meta: [
      { title: "Rescue Cases — ResQ Paws" },
      {
        name: "description",
        content:
          "Browse live and past stray animal rescue cases across Nagpur, filterable by animal type, status and urgency.",
      },
      { property: "og:title", content: "Rescue Cases — ResQ Paws" },
      {
        property: "og:description",
        content: "A public gallery of stray animal rescue cases coordinated through ResQ Paws.",
      },
    ],
  }),
  component: RescueCases,
});

const animalOptions = [
  { value: "Dog", label: "Dog" },
  { value: "Cat", label: "Cat" },
  { value: "Cow", label: "Cow" },
  { value: "Bird", label: "Bird" },
  { value: "Other", label: "Other" },
];

const statusOptions = [
  { value: "REPORTED", label: "Reported" },
  { value: "ASSIGNED", label: "Assigned" },
  { value: "ACCEPTED", label: "Accepted" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "RESCUED", label: "Rescued" },
  { value: "CLOSED", label: "Closed" },
];

const emergencyOptions = [
  { value: "CRITICAL", label: "Critical" },
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

function RescueCases() {
  const [search, setSearch] = useState("");
  const [animal, setAnimal] = useState("all");
  const [status, setStatus] = useState("all");
  const [emergency, setEmergency] = useState("all");

  const { data, loading, error, retry } = useAsync(
    () =>
      isApiEnabled
        ? publicService.getRescueCases({ limit: 200 }).then((r) => r.items)
        : Promise.resolve(mockReports),
    [],
  );
  const reports = data ?? [];

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (animal !== "all" && r.animal !== animal) return false;
      if (status !== "all" && r.status !== status) return false;
      if (emergency !== "all" && r.emergency !== emergency) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        if (
          !r.title.toLowerCase().includes(q) &&
          !r.area.toLowerCase().includes(q) &&
          !r.id.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [reports, search, animal, status, emergency]);

  return (
    <PublicShell>
      <section className="border-b border-border bg-primary-soft/40">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <h1 className="font-display text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Rescue cases
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground sm:text-lg">
            A public feed of rescue requests coordinated across Nagpur — from the moment they're
            reported to the moment the animal is safe.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <FilterBar>
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by title, area or ID…"
            label="Search rescue cases"
            className="w-full sm:w-64"
          />
          <FilterSelect value={animal} onChange={setAnimal} options={animalOptions} label="Animal" />
          <FilterSelect value={status} onChange={setStatus} options={statusOptions} label="Status" />
          <FilterSelect
            value={emergency}
            onChange={setEmergency}
            options={emergencyOptions}
            label="Urgency"
          />
        </FilterBar>

        <p className="mt-4 text-sm text-muted-foreground">
          Showing {filtered.length} of {reports.length} cases
        </p>

        {loading ? (
          <div className="mt-6">
            <TableSkeleton rows={6} cols={3} />
          </div>
        ) : error ? (
          <div className="mt-6">
            <ErrorState onRetry={retry} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            className="mt-6"
            title="No cases match your filters"
            description="Try adjusting your search or filters to see more rescue cases."
          />
        ) : (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((report) => (
              <CaseCard
                key={report.id}
                report={report}
                to="/rescue-cases/$id"
                params={{ id: report.id }}
              />
            ))}
          </div>
        )}
      </section>
    </PublicShell>
  );
}
