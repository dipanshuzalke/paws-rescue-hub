import { createFileRoute, Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";
import { useMemo, useState } from "react";

import { DataTable, type Column } from "@/components/admin/data-table";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/states";
import { PriorityBadge, StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { useAsync } from "@/hooks/use-async";
import { timeAgo } from "@/lib/format";
import { getReports } from "@/services";
import { adminService } from "@/services/adminService";
import { useApp } from "@/store/app-store";
import type { RescueReport } from "@/types";

export const Route = createFileRoute("/admin/reports/")({
  head: () => ({
    meta: [
      { title: "All Reports · ResQ Paws Admin" },
      {
        name: "description",
        content: "Search and filter every rescue report submitted across ResQ Paws.",
      },
      { property: "og:title", content: "All Reports · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Full case list with status, emergency and city filters for administrators.",
      },
    ],
  }),
  component: AdminReports,
});

function AdminReports() {
  const { data, loading, error, retry } = useAsync(getReports, []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [emergency, setEmergency] = useState("all");
  const [city, setCity] = useState("all");

  const list = data ?? [];

  const cities = useMemo(() => Array.from(new Set(list.map((r) => r.city))).sort(), [list]);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (emergency !== "all" && r.emergency !== emergency) return false;
      if (city !== "all" && r.city !== city) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.id.toLowerCase().includes(q) ||
        r.title.toLowerCase().includes(q) ||
        r.area.toLowerCase().includes(q) ||
        r.reporterName.toLowerCase().includes(q)
      );
    });
  }, [list, status, emergency, city, search]);

  const columns: Column<RescueReport>[] = [
    {
      key: "id",
      header: "Case",
      sortable: true,
      accessor: (r) => r.id,
      cell: (r) => (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-foreground">#{r.id}</p>
          <p className="truncate text-xs text-muted-foreground">{r.title}</p>
        </div>
      ),
      className: "min-w-[180px]",
    },
    {
      key: "emergency",
      header: "Priority",
      sortable: true,
      accessor: (r) => r.emergency,
      cell: (r) => <PriorityBadge level={r.emergency} />,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: "city",
      header: "Location",
      cell: (r) => (
        <span className="truncate text-sm text-muted-foreground">
          {r.area}, {r.city}
        </span>
      ),
    },
    {
      key: "reporterName",
      header: "Reporter",
      sortable: true,
      accessor: (r) => r.reporterName,
      cell: (r) => <span className="truncate text-sm text-foreground">{r.reporterName}</span>,
    },
    {
      key: "rescuerName",
      header: "Rescuer / NGO",
      cell: (r) => (
        <span className="truncate text-sm text-muted-foreground">
          {r.rescuerName ?? r.ngoName ?? "Unassigned"}
        </span>
      ),
    },
    {
      key: "createdAt",
      header: "Reported",
      sortable: true,
      accessor: (r) => r.createdAt,
      cell: (r) => <span className="text-sm text-muted-foreground">{timeAgo(r.createdAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <Button variant="ghost" size="icon" asChild aria-label={`View case ${r.id}`}>
          <Link to="/admin/reports/$id" params={{ id: r.id }}>
            <Eye className="h-4 w-4" aria-hidden="true" />
          </Link>
        </Button>
      ),
      className: "w-10 text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="All Reports" description="Every rescue report submitted across ResQ Paws." />
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, title, area or reporter…"
          className="flex-1 sm:min-w-[240px]"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={[
            { value: "REPORTED", label: "Reported" },
            { value: "ASSIGNED", label: "Assigned" },
            { value: "ACCEPTED", label: "Accepted" },
            { value: "IN_PROGRESS", label: "In progress" },
            { value: "RESCUED", label: "Rescued" },
            { value: "CLOSED", label: "Closed" },
            { value: "CANCELLED", label: "Cancelled" },
          ]}
        />
        <FilterSelect
          value={emergency}
          onChange={setEmergency}
          label="Emergency"
          options={[
            { value: "CRITICAL", label: "Critical" },
            { value: "HIGH", label: "High" },
            { value: "MEDIUM", label: "Medium" },
            { value: "LOW", label: "Low" },
          ]}
        />
        <FilterSelect
          value={city}
          onChange={setCity}
          label="City"
          options={cities.map((c) => ({ value: c, label: c }))}
        />
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <p className="text-sm text-critical">
          {error} <Button variant="link" onClick={retry}>Retry</Button>
        </p>
      ) : (
        <DataTable columns={columns} data={filtered} getRowId={(r) => r.id} />
      )}
    </div>
  );
}
