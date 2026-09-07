import { createFileRoute } from "@tanstack/react-router";
import { Ban, CheckCircle2, Eye, MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/data-table";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { TableSkeleton } from "@/components/shared/states";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { formatDate, initials } from "@/lib/format";
import { getUsers } from "@/services";
import { adminService } from "@/services/adminService";
import { useApp } from "@/store/app-store";
import type { User } from "@/types";

export const Route = createFileRoute("/admin/citizens")({
  head: () => ({
    meta: [
      { title: "Citizens · ResQ Paws Admin" },
      {
        name: "description",
        content: "Review citizen accounts, their reporting activity and account status.",
      },
      { property: "og:title", content: "Citizens · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Search, filter and manage citizen reporters on ResQ Paws.",
      },
    ],
  }),
  component: AdminCitizens,
});

function AdminCitizens() {
  const { apiMode } = useApp();
  const { data, loading, error, retry } = useAsync(
    () =>
      apiMode
        ? adminService.getUsers({ role: "citizen", limit: 200 }).then((r) => r.items)
        : getUsers().then((users) => users.filter((u) => u.role === "citizen")),
    [apiMode],
  );

  const [overrides, setOverrides] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [detail, setDetail] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<User | null>(null);

  const list = (overrides ?? data ?? []).filter((u) => u.role === "citizen");

  const filtered = useMemo(() => {
    return list.filter((u) => {
      if (status !== "all" && u.status !== status) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
      );
    });
  }, [list, status, search]);

  const activeCount = list.filter((u) => u.status === "ACTIVE" || u.status === "VERIFIED").length;
  const totalReports = list.reduce((sum, u) => sum + (u.cases ?? 0), 0);

  const toggleStatus = async () => {
    if (!confirm) return;
    const suspending = confirm.status !== "INACTIVE";
    const nextStatus: User["status"] = suspending ? "INACTIVE" : "ACTIVE";
    try {
      const updated = apiMode
        ? await adminService.setUserStatus(confirm.id, nextStatus)
        : { ...confirm, status: nextStatus };
      setOverrides((prev) => (prev ?? list).map((u) => (u.id === confirm.id ? updated : u)));
      toast.success(
        suspending ? `${confirm.name} has been suspended.` : `${confirm.name} has been reactivated.`,
      );
      setConfirm(null);
    } catch {
      toast.error(`Could not ${suspending ? "suspend" : "reactivate"} ${confirm.name}. Please try again.`);
    }
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Citizen",
      sortable: true,
      accessor: (u) => u.name,
      cell: (u) => (
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
            {initials(u.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{u.name}</p>
            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
          </div>
        </div>
      ),
      className: "min-w-[220px]",
    },
    {
      key: "phone",
      header: "Phone",
      cell: (u) => <span className="text-sm text-muted-foreground">{u.phone}</span>,
    },
    {
      key: "location",
      header: "Area",
      sortable: true,
      accessor: (u) => u.location,
      cell: (u) => <span className="text-sm text-muted-foreground">{u.location}</span>,
    },
    {
      key: "cases",
      header: "Reports filed",
      sortable: true,
      accessor: (u) => u.cases,
      cell: (u) => <span className="text-sm font-medium text-foreground">{u.cases}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (u) => u.status,
      cell: (u) => <UserStatusBadge status={u.status} />,
    },
    {
      key: "joinedAt",
      header: "Joined",
      sortable: true,
      accessor: (u) => u.joinedAt,
      cell: (u) => <span className="text-sm text-muted-foreground">{formatDate(u.joinedAt)}</span>,
    },
    {
      key: "actions",
      header: "",
      cell: (u) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={`Actions for ${u.name}`}>
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setDetail(u)}>
              <Eye className="h-4 w-4" aria-hidden="true" /> View details
            </DropdownMenuItem>
            {u.status === "INACTIVE" ? (
              <DropdownMenuItem onClick={() => setConfirm(u)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Reactivate
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => setConfirm(u)}
              >
                <Ban className="h-4 w-4" aria-hidden="true" /> Suspend
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-10 text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizens"
        description="Everyone reporting stray animals in distress across the network."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Total citizens" value={list.length} />
        <StatCard label="Active accounts" value={activeCount} />
        <StatCard label="Reports filed" value={totalReports} />
      </div>

      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, email or area…"
          className="flex-1 sm:min-w-[240px]"
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "VERIFIED", label: "Verified" },
            { value: "PENDING", label: "Pending" },
            { value: "INACTIVE", label: "Suspended" },
          ]}
        />
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <p className="text-sm text-critical">
          {error}{" "}
          <Button variant="link" onClick={retry}>
            Retry
          </Button>
        </p>
      ) : (
        <DataTable columns={columns} data={filtered} getRowId={(u) => u.id} />
      )}

      <UserDetailDialog user={detail} open={!!detail} onOpenChange={(v) => !v && setDetail(null)} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm?.status === "INACTIVE" ? "Reactivate this citizen?" : "Suspend this citizen?"}
        description={
          confirm?.status === "INACTIVE"
            ? `${confirm?.name} will be able to submit rescue reports again.`
            : `${confirm?.name} will no longer be able to submit rescue reports.`
        }
        confirmLabel={confirm?.status === "INACTIVE" ? "Reactivate" : "Suspend"}
        destructive={confirm?.status !== "INACTIVE"}
        onConfirm={toggleStatus}
      />
    </div>
  );
}
