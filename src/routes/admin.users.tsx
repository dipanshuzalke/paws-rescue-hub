import { createFileRoute } from "@tanstack/react-router";
import { Ban, CheckCircle2, Eye, MoreHorizontal, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { DataTable, type Column } from "@/components/admin/data-table";
import { UserDetailDialog } from "@/components/admin/user-detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
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
import type { User } from "@/types";

export const Route = createFileRoute("/admin/users")({
  head: () => ({
    meta: [
      { title: "All Users · ResQ Paws Admin" },
      { name: "description", content: "Manage every citizen, rescuer, NGO and admin account." },
      { property: "og:title", content: "All Users · ResQ Paws Admin" },
      { property: "og:description", content: "Search, filter and manage all ResQ Paws accounts." },
    ],
  }),
  component: AdminUsers,
});

function AdminUsers() {
  const { data, loading, error, retry } = useAsync(getUsers, []);
  const [users, setUsers] = useState<User[] | null>(null);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [detailUser, setDetailUser] = useState<User | null>(null);
  const [confirm, setConfirm] = useState<{ user: User; action: "toggle" | "delete" } | null>(null);

  const list = users ?? data ?? [];

  const filtered = useMemo(() => {
    return list.filter((u) => {
      if (role !== "all" && u.role !== role) return false;
      if (status !== "all" && u.status !== status) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.location.toLowerCase().includes(q)
      );
    });
  }, [list, role, status, search]);

  const applyAction = () => {
    if (!confirm) return;
    const { user, action } = confirm;
    if (action === "delete") {
      setUsers((prev) => (prev ?? list).filter((u) => u.id !== user.id));
      toast.success(`${user.name} was removed from the platform.`);
    } else {
      const nextStatus = user.status === "ACTIVE" || user.status === "VERIFIED" ? "INACTIVE" : "ACTIVE";
      setUsers((prev) => (prev ?? list).map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)));
      toast.success(`${user.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`);
    }
    setConfirm(null);
  };

  const columns: Column<User>[] = [
    {
      key: "name",
      header: "Name",
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
      className: "min-w-[200px]",
    },
    {
      key: "role",
      header: "Role",
      sortable: true,
      accessor: (u) => u.role,
      cell: (u) => <span className="text-sm capitalize text-foreground">{u.role}</span>,
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      accessor: (u) => u.status,
      cell: (u) => <UserStatusBadge status={u.status} />,
    },
    {
      key: "location",
      header: "Location",
      cell: (u) => <span className="truncate text-sm text-muted-foreground">{u.location}</span>,
    },
    {
      key: "cases",
      header: "Cases",
      sortable: true,
      accessor: (u) => u.cases,
      cell: (u) => <span className="text-sm text-foreground">{u.cases}</span>,
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
            <DropdownMenuItem onClick={() => setDetailUser(u)}>
              <Eye className="h-4 w-4" aria-hidden="true" /> View details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setConfirm({ user: u, action: "toggle" })}>
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
              {u.status === "ACTIVE" || u.status === "VERIFIED" ? "Deactivate" : "Activate"}
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirm({ user: u, action: "delete" })}
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" /> Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
      className: "w-10 text-right",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="All Users" description="Manage every account across ResQ Paws." />
      <FilterBar>
        <SearchBar value={search} onChange={setSearch} placeholder="Search by name, email or location…" className="flex-1 sm:min-w-[240px]" />
        <FilterSelect
          value={role}
          onChange={setRole}
          label="Role"
          options={[
            { value: "citizen", label: "Citizen" },
            { value: "rescuer", label: "Rescuer" },
            { value: "ngo", label: "NGO" },
            { value: "admin", label: "Admin" },
          ]}
        />
        <FilterSelect
          value={status}
          onChange={setStatus}
          label="Status"
          options={[
            { value: "ACTIVE", label: "Active" },
            { value: "INACTIVE", label: "Inactive" },
            { value: "PENDING", label: "Pending" },
            { value: "VERIFIED", label: "Verified" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
      </FilterBar>

      {loading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : error ? (
        <p className="text-sm text-critical">{error} <Button variant="link" onClick={retry}>Retry</Button></p>
      ) : (
        <DataTable columns={columns} data={filtered} getRowId={(u) => u.id} />
      )}

      <UserDetailDialog user={detailUser} open={!!detailUser} onOpenChange={(v) => !v && setDetailUser(null)} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm?.action === "delete" ? "Delete this user?" : "Change account status?"}
        description={
          confirm?.action === "delete"
            ? `${confirm.user.name} will be permanently removed from the platform. This cannot be undone.`
            : `This will ${confirm?.user.status === "ACTIVE" ? "deactivate" : "activate"} ${confirm?.user.name}'s account.`
        }
        confirmLabel={confirm?.action === "delete" ? "Delete" : "Confirm"}
        destructive={confirm?.action === "delete"}
        onConfirm={applyAction}
      />
    </div>
  );
}
