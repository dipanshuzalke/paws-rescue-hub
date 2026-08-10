import { Link, createFileRoute } from "@tanstack/react-router";
import { LayoutGrid, List, Search } from "lucide-react";
import { useMemo, useState } from "react";

import { CaseCard } from "@/components/rescue/case-card";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { CardSkeletonGrid, EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAsync } from "@/hooks/use-async";
import { formatDate } from "@/lib/format";
import { getMyReports } from "@/services";
import { useApp } from "@/store/app-store";
import type { AnimalType, Emergency, RescueStatus } from "@/types";

export const Route = createFileRoute("/citizen/reports/")({
  head: () => ({
    meta: [
      { title: "My Reports · ResQ Paws" },
      { name: "description", content: "Browse and filter all the rescue reports you've submitted." },
      { property: "og:title", content: "My Reports · ResQ Paws" },
      { property: "og:description", content: "Browse and filter all the rescue reports you've submitted." },
    ],
  }),
  component: CitizenReports,
});

function CitizenReports() {
  const { user, reports } = useApp();
  const { data, loading } = useAsync(() => getMyReports(user?.id ?? "", reports), [user?.id, reports]);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<RescueStatus | "all">("all");
  const [emergency, setEmergency] = useState<Emergency | "all">("all");
  const [animal, setAnimal] = useState<AnimalType | "all">("all");
  const [view, setView] = useState<"grid" | "table">("grid");

  const filtered = useMemo(() => {
    const list = data ?? [];
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (emergency !== "all" && r.emergency !== emergency) return false;
      if (animal !== "all" && r.animal !== animal) return false;
      if (query && !`${r.title} ${r.area} ${r.id}`.toLowerCase().includes(query.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [data, status, emergency, animal, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">My reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {data?.length ?? 0} report{(data?.length ?? 0) === 1 ? "" : "s"} submitted so far.
          </p>
        </div>
        <Button asChild>
          <Link to="/citizen/report">Report an animal</Link>
        </Button>
      </div>

      <div className="card-surface flex flex-wrap items-center gap-3 p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, area or ID"
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as RescueStatus | "all")}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {(["REPORTED", "ASSIGNED", "ACCEPTED", "IN_PROGRESS", "RESCUED", "CLOSED", "CANCELLED"] as RescueStatus[]).map((s) => (
              <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={emergency} onValueChange={(v) => setEmergency(v as Emergency | "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Emergency" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All levels</SelectItem>
            {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Emergency[]).map((e) => (
              <SelectItem key={e} value={e}>{e}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={animal} onValueChange={(v) => setAnimal(v as AnimalType | "all")}>
          <SelectTrigger className="w-[130px]"><SelectValue placeholder="Animal" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All animals</SelectItem>
            {(["Dog", "Cat", "Cow", "Bird", "Other"] as AnimalType[]).map((a) => (
              <SelectItem key={a} value={a}>{a}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-1 rounded-lg border border-border p-1">
          <Button
            type="button"
            size="icon"
            variant={view === "grid" ? "secondary" : "ghost"}
            aria-label="Grid view"
            onClick={() => setView("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={view === "table" ? "secondary" : "ghost"}
            aria-label="Table view"
            onClick={() => setView("table")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading ? (
        <CardSkeletonGrid />
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No reports found"
          description="Try adjusting your filters, or submit a new rescue report."
        />
      ) : view === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <CaseCard key={r.id} report={r} to="/citizen/reports/$id" params={{ id: r.id }} />
          ))}
        </div>
      ) : (
        <div className="card-surface overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Animal</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Emergency</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>
                    <Link to="/citizen/reports/$id" params={{ id: r.id }} className="font-semibold text-primary hover:underline">
                      #{r.id}
                    </Link>
                  </TableCell>
                  <TableCell className="truncate">{r.animal} · {r.condition}</TableCell>
                  <TableCell className="truncate">{r.area}</TableCell>
                  <TableCell><PriorityBadge level={r.emergency} /></TableCell>
                  <TableCell><StatusBadge status={r.status} /></TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
