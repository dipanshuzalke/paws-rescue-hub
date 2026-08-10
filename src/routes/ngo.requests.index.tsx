import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo, useState } from "react";

import { AssignDialog } from "@/components/ngo/assign-dialog";
import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { useApp } from "@/store/app-store";
import type { AnimalType, Emergency, RescueReport, RescueStatus } from "@/types";

export const Route = createFileRoute("/ngo/requests/")({
  head: () => ({
    meta: [
      { title: "Rescue Requests · ResQ Paws" },
      { name: "description", content: "Triage incoming rescue requests and assign rescuers." },
      { property: "og:title", content: "Rescue Requests · ResQ Paws" },
      { property: "og:description", content: "Search, filter and assign rescue requests to your team." },
    ],
  }),
  component: NgoRequests,
});

const PAGE_SIZE = 8;

type SortKey = "createdAt" | "emergency" | "status";

const emergencyOrder: Record<Emergency, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function NgoRequests() {
  const { reports } = useApp();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [emergency, setEmergency] = useState("all");
  const [animal, setAnimal] = useState("all");
  const [area, setArea] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [sortKey, setSortKey] = useState<SortKey>("createdAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [page, setPage] = useState(1);
  const [assignTarget, setAssignTarget] = useState<RescueReport | null>(null);

  const areas = useMemo(
    () => Array.from(new Set(reports.map((r) => r.area))).sort(),
    [reports],
  );

  const filtered = useMemo(() => {
    let list = reports.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (emergency !== "all" && r.emergency !== emergency) return false;
      if (animal !== "all" && r.animal !== animal) return false;
      if (area !== "all" && r.area !== area) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.id.toLowerCase().includes(q) &&
          !r.title.toLowerCase().includes(q) &&
          !r.area.toLowerCase().includes(q) &&
          !r.reporterName.toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
    list = list.slice().sort((a, b) => {
      let cmp = 0;
      if (sortKey === "createdAt") cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sortKey === "emergency") cmp = emergencyOrder[a.emergency] - emergencyOrder[b.emergency];
      if (sortKey === "status") cmp = a.status.localeCompare(b.status);
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [reports, search, status, emergency, animal, area, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const toggleSelectAll = () => {
    if (selected.length === pageItems.length) setSelected([]);
    else setSelected(pageItems.map((r) => r.id));
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const statusOptions: RescueStatus[] = [
    "REPORTED",
    "ASSIGNED",
    "ACCEPTED",
    "IN_PROGRESS",
    "RESCUED",
    "CLOSED",
    "CANCELLED",
  ];
  const animalOptions: AnimalType[] = ["Dog", "Cat", "Cow", "Bird", "Other"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rescue requests"
        description={`${filtered.length} request${filtered.length === 1 ? "" : "s"} matching your filters.`}
      />

      <FilterBar>
        <SearchBar
          value={search}
          onChange={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by ID, title, area, reporter…"
          className="w-full sm:w-64"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setStatus(v);
            setPage(1);
          }}
          label="Status"
          options={statusOptions.map((s) => ({ value: s, label: s.replace("_", " ") }))}
        />
        <FilterSelect
          value={emergency}
          onChange={(v) => {
            setEmergency(v);
            setPage(1);
          }}
          label="Emergency"
          options={(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const).map((e) => ({
            value: e,
            label: e,
          }))}
        />
        <FilterSelect
          value={animal}
          onChange={(v) => {
            setAnimal(v);
            setPage(1);
          }}
          label="Animal"
          options={animalOptions.map((a) => ({ value: a, label: a }))}
        />
        <FilterSelect
          value={area}
          onChange={(v) => {
            setArea(v);
            setPage(1);
          }}
          label="Area"
          options={areas.map((a) => ({ value: a, label: a }))}
        />
      </FilterBar>

      {selected.length > 0 ? (
        <div className="card-surface flex flex-wrap items-center justify-between gap-3 p-3">
          <p className="text-sm font-medium text-foreground">{selected.length} selected</p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelected([]);
              }}
            >
              Clear selection
            </Button>
            <Button
              size="sm"
              onClick={() => {
                const first = pageItems.find((r) => selected.includes(r.id));
                if (first) setAssignTarget(first);
              }}
            >
              Bulk assign
            </Button>
          </div>
        </div>
      ) : null}

      {pageItems.length === 0 ? (
        <EmptyState title="No requests found" description="Try adjusting your search or filters." />
      ) : (
        <div className="card-surface overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={pageItems.length > 0 && selected.length === pageItems.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all requests on this page"
                  />
                </TableHead>
                <TableHead>Request</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("emergency")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Emergency <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("status")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Status <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead>Area</TableHead>
                <TableHead>
                  <button
                    type="button"
                    onClick={() => toggleSort("createdAt")}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Reported <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageItems.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Checkbox
                      checked={selected.includes(r.id)}
                      onCheckedChange={() => toggleSelect(r.id)}
                      aria-label={`Select request ${r.id}`}
                    />
                  </TableCell>
                  <TableCell className="min-w-0 max-w-[240px]">
                    <Link
                      to="/ngo/requests/$id"
                      params={{ id: r.id }}
                      className="block truncate text-sm font-semibold text-foreground hover:underline"
                    >
                      #{r.id} · {r.title}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">{r.reporterName}</p>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge level={r.emergency} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={r.status} />
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">
                    {r.area}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(r.createdAt)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button asChild size="sm" variant="outline">
                        <Link to="/ngo/requests/$id" params={{ id: r.id }}>
                          View
                        </Link>
                      </Button>
                      {r.status === "REPORTED" ? (
                        <Button size="sm" onClick={() => setAssignTarget(r)}>
                          Assign
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {filtered.length > 0 ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              aria-label="Previous page"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              aria-label="Next page"
            >
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}

      <AssignDialog report={assignTarget} open={!!assignTarget} onOpenChange={(v) => !v && setAssignTarget(null)} />
    </div>
  );
}
