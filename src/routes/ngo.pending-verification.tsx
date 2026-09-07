import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Eye, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { evidenceService } from "@/services/evidenceService";
// import type { RescueReport } from "@/types";
import { useAsync } from "@/hooks/use-async";

export const Route = createFileRoute("/ngo/pending-verification")({
  head: () => ({
    meta: [
      { title: "Pending Verification · ResQ Paws" },
      {
        name: "description",
        content: "Review and verify rescue evidence submissions.",
      },
      { property: "og:title", content: "Pending Verification · ResQ Paws" },
      {
        property: "og:description",
        content: "Review and verify rescue evidence submitted by rescuers.",
      },
    ],
  }),
  component: NgoPendingVerification,
});

function NgoPendingVerification() {
  const [search, setSearch] = useState("");
  const [emergency, setEmergency] = useState("all");
  const {
    data: reports,
    loading,
    error,
    retry,
  } = useAsync(() => evidenceService.getPending({ limit: 100 }).then((r) => r.items), []);

  const list = reports ?? [];

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (emergency !== "all" && r.emergency !== emergency) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        (r.rescuerName ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, search, emergency]);

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader
          title="Pending Verification"
          description="Review rescue evidence awaiting approval."
        />
        <div className="space-y-2 animate-pulse">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pending Verification"
        description="Review rescue evidence awaiting approval. Approve verified rescues or request revisions."
      />

      <FilterBar>
        <SearchBar
          placeholder="Search by case ID, location, or rescuer..."
          value={search}
          onChange={setSearch}
        />
        <FilterSelect
          label="Emergency level"
          value={emergency}
          onChange={setEmergency}
          options={[
            { value: "all", label: "All levels" },
            { value: "CRITICAL", label: "Critical" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
        />
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState
          title={search ? "No cases found" : "No pending verifications"}
          description={
            search
              ? "Try adjusting your search criteria."
              : "All rescue evidence has been reviewed."
          }
        />
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Rescuer</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((report) => (
                <TableRow key={report.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">#{report.id}</p>
                      <p className="truncate text-xs text-muted-foreground">{report.title}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-foreground">{report.rescuerName || "Unassigned"}</p>
                  </TableCell>
                  <TableCell>
                    <PriorityBadge level={report.emergency} />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">
                      {report.evidence?.submittedAt
                        ? formatDateTime(report.evidence.submittedAt)
                        : "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {report.evidence?.status === "VERIFIED" ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                          <span className="text-sm text-success font-medium">Verified</span>
                        </>
                      ) : report.evidence?.status === "REJECTED" ? (
                        <>
                          <XCircle className="h-4 w-4 text-destructive" aria-hidden="true" />
                          <span className="text-sm text-destructive font-medium">Rejected</span>
                        </>
                      ) : (
                        <>
                          <div className="h-2 w-2 rounded-full bg-warning" aria-hidden="true" />
                          <span className="text-sm text-warning font-medium">Pending</span>
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/ngo/evidence-review/$id" params={{ id: report.id }}>
                        <Eye className="h-4 w-4 mr-1" aria-hidden="true" />
                        Review
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive font-medium">Error loading verifications</p>
          <p className="text-xs text-destructive/70 mt-1">{String(error)}</p>
          <Button size="sm" variant="outline" className="mt-3" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}
    </div>
  );
}
