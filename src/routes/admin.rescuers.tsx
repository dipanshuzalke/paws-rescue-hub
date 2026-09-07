import { createFileRoute } from "@tanstack/react-router";
import { Ban, CheckCircle2, Eye, MoreHorizontal, ShieldCheck, Star } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/data-table";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { TableSkeleton } from "@/components/shared/states";
import { AvailabilityBadge, UserStatusBadge } from "@/components/shared/status-badge";
import { PresenceBadge } from "@/components/shared/presence-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { formatDate, initials } from "@/lib/format";
import { getRescuers } from "@/services";
import { adminService } from "@/services/adminService";
import { useApp } from "@/store/app-store";
import type { Rescuer } from "@/types";

export const Route = createFileRoute("/admin/rescuers")({
  head: () => ({
    meta: [
      { title: "Rescuers · ResQ Paws Admin" },
      {
        name: "description",
        content: "Manage rescuer verification, availability and performance across ResQ Paws.",
      },
      { property: "og:title", content: "Rescuers · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Search, filter and manage all rescuer accounts on ResQ Paws.",
      },
    ],
  }),
  component: AdminRescuers,
});

function AdminRescuers() {
  const { apiMode } = useApp();
  const { data, loading, error, retry } = useAsync(
    () => (apiMode ? adminService.getRescuers({ limit: 200 }).then((r) => r.items) : getRescuers()),
    [apiMode],
  );
  const [rescuers, setRescuers] = useState<Rescuer[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [detail, setDetail] = useState<Rescuer | null>(null);
  const [confirm, setConfirm] = useState<{ rescuer: Rescuer; action: "verify" | "suspend" } | null>(
    null,
  );

  const list = rescuers ?? data ?? [];

  useEffect(() => {
    if (!apiMode) return;
    const interval = window.setInterval(retry, 30_000);
    return () => window.clearInterval(interval);
  }, [apiMode, retry]);

  const filtered = useMemo(() => {
    return list.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (availability !== "all" && r.availability !== availability) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.organization ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, status, availability, search]);

  const applyAction = () => {
    if (!confirm) return;
    const { rescuer, action } = confirm;
    const nextStatus = action === "verify" ? "VERIFIED" : "INACTIVE";
    setRescuers((prev) =>
      (prev ?? list).map((r) => (r.id === rescuer.id ? { ...r, status: nextStatus } : r)),
    );
    toast.success(
      action === "verify"
        ? `${rescuer.name} has been verified.`
        : `${rescuer.name} has been suspended.`,
    );
    setConfirm(null);
  };

  const columns: Column<Rescuer>[] = [
    {
      key: "name",
      header: "Rescuer",
      sortable: true,
      accessor: (r) => r.name,
      cell: (r) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials(r.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{r.name}</p>
            <p className="truncate text-xs text-muted-foreground">{r.organization ?? "Independent"}</p>
          </div>
        </div>
      ),
      className: "min-w-[200px]",
    },
    {
      key: "status",
      header: "Verification",
      sortable: true,
      accessor: (r) => r.status,
      cell: (r) => <UserStatusBadge status={r.status} />,
    },
    {
      key: "availability",
      header: "Availability",
      sortable: true,
      accessor: (r) => r.availability,
      cell: (r) => <AvailabilityBadge value={r.availability} />,
    },
    {
      key: "online",
      header: "Live status",
      sortable: true,
      accessor: (r) => (r.isOnline ? "Online" : "Offline"),
      cell: (r) => <PresenceBadge online={r.isOnline ?? false} />,
    },
    {
      key: "activeCases",
      header: "Active",
      sortable: true,
      accessor: (r) => r.activeCases,
      cell: (r) => <span className="text-sm text-foreground">{r.activeCases}</span>,
    },
    {
      key: "completedCases",
      header: "Completed",
      sortable: true,
      accessor: (r) => r.completedCases,
      cell: (r) => <span className="text-sm text-foreground">{r.completedCases}</span>,
    },
    {
      key: "rating",
      header: "Rating",
      sortable: true,
      accessor: (r) => r.rating,
      cell: (r) => (
        <span className="inline-flex items-center gap-1 text-sm font-medium text-foreground">
          <Star className="h-3.5 w-3.5 fill-caution text-caution" aria-hidden="true" />
          {r.rating.toFixed(1)}
        </span>
      ),
    },
    {
      key: "avgResponseMins",
      header: "Avg response",
      sortable: true,
      accessor: (r) => r.avgResponseMins,
      cell: (r) => <span className="text-sm text-muted-foreground">{r.avgResponseMins} min</span>,
    },
    {
      key: "joinedAt",
      header: "Joined",
      sortable: true,
      accessor: (r) => r.joinedAt,
      cell: (r) => <span className="text-sm text-muted-foreground">{formatDate(r.joinedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (r) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${r.name}`}>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetail(r)}>
              <Eye className="h-4 w-4" aria-hidden="true" /> View details
            </DropdownMenuItem>
            {r.status !== "VERIFIED" ? (
              <DropdownMenuItem onClick={() => setConfirm({ rescuer: r, action: "verify" })}>
                <ShieldCheck className="h-4 w-4" aria-hidden="true" /> Verify
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirm({ rescuer: r, action: "suspend" })}
            >
              <Ban className="h-4 w-4" aria-hidden="true" /> Suspend
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-10 text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rescuers"
        description="Verify field rescuers and monitor their availability and performance."
      />
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or NGO…"
          className="flex-1 sm:min-w-[240px]"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Verification"
          options={[
            { value: "VERIFIED", label: "Verified" },
            { value: "PENDING", label: "Pending" },
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Suspended" },
            { value: "REJECTED", label: "Rejected" },
          ]}
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

      {loading ? (
        <TableSkeleton rows={8} cols={7} />
      ) : error ? (
        <p className="text-sm text-critical">
          {error} <Button variant="link" onClick={retry}>Retry</Button>
        </p>
      ) : (
        <DataTable columns={columns} data={filtered} getRowId={(r) => r.id} />
      )}

      <UserDetailDialog user={detail} open={!!detail} onOpenChange={(v) => !v && setDetail(null)} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm?.action === "verify" ? "Verify this rescuer?" : "Suspend this rescuer?"}
        description={
          confirm?.action === "verify"
            ? `${confirm.rescuer.name} will be marked as a verified rescuer.`
            : `${confirm?.rescuer.name} will be suspended and unable to accept new rescues.`
        }
        confirmLabel={confirm?.action === "verify" ? "Verify" : "Suspend"}
        destructive={confirm?.action === "suspend"}
        onConfirm={applyAction}
      />
    </div>
  );
}
