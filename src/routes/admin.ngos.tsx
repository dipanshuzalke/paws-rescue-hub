import { createFileRoute } from "@tanstack/react-router";
import { Ban, Building2, CheckCircle2, Eye, MoreHorizontal, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { NgoDetailDialog } from "@/components/admin/ngo-detail-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { CardSkeletonGrid, EmptyState } from "@/components/shared/states";
import { UserStatusBadge } from "@/components/shared/status-badge";
import { PresenceBadge } from "@/components/shared/presence-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAsync } from "@/hooks/use-async";
import { formatDate } from "@/lib/format";
import { getNGOs } from "@/services";
import { adminService } from "@/services/adminService";
import { useApp } from "@/store/app-store";
import type { NGO } from "@/types";

export const Route = createFileRoute("/admin/ngos")({
  head: () => ({
    meta: [
      { title: "NGO Directory · ResQ Paws Admin" },
      {
        name: "description",
        content: "Review, approve and manage partner NGO verification requests.",
      },
      { property: "og:title", content: "NGO Directory · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Browse partner NGOs and manage verification status on ResQ Paws.",
      },
    ],
  }),
  component: AdminNgos,
});

const verificationTone: Record<NGO["verification"], string> = {
  VERIFIED: "border-success/25 bg-success-soft text-success",
  PENDING: "border-caution/40 bg-caution-soft text-caution-foreground",
  REJECTED: "border-critical/30 bg-critical-soft text-critical",
};

function AdminNgos() {
  const { apiMode } = useApp();
  const { data, loading, error, retry } = useAsync(
    () => (apiMode ? adminService.getNgos({ limit: 200 }).then((r) => r.items) : getNGOs()),
    [apiMode],
  );
  const [ngos, setNgos] = useState<NGO[] | null>(null);
  const [search, setSearch] = useState("");
  const [verification, setVerification] = useState("all");
  const [detail, setDetail] = useState<NGO | null>(null);
  const [confirm, setConfirm] = useState<{ ngo: NGO; action: "approve" | "reject" } | null>(null);

  const list = ngos ?? data ?? [];

  useEffect(() => {
    if (!apiMode) return;
    const interval = window.setInterval(retry, 30_000);
    return () => window.clearInterval(interval);
  }, [apiMode, retry]);

  const filtered = useMemo(() => {
    return list.filter((n) => {
      if (verification !== "all" && n.verification !== verification) return false;
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        n.name.toLowerCase().includes(q) ||
        n.contactPerson.toLowerCase().includes(q) ||
        n.location.toLowerCase().includes(q)
      );
    });
  }, [list, verification, search]);

  const applyAction = async () => {
    if (!confirm) return;
    const { ngo, action } = confirm;
    const nextVerification: NGO["verification"] =
      action === "approve" ? "VERIFIED" : "REJECTED";
    try {
      const updated: NGO = apiMode
        ? action === "approve"
          ? await adminService.verifyNgo(ngo.id)
          : await adminService.rejectNgo(ngo.id)
        : { ...ngo, verification: nextVerification };
      setNgos((prev) => (prev ?? list).map((n) => (n.id === ngo.id ? updated : n)));
      toast.success(
        action === "approve" ? `${ngo.name} has been approved.` : `${ngo.name} has been rejected.`,
      );
      setConfirm(null);
    } catch {
      toast.error(`Could not ${action === "approve" ? "approve" : "reject"} ${ngo.name}. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="NGO Directory"
        description="Review partner organizations and manage their verification status."
      />
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name, contact or location…"
          className="flex-1 sm:min-w-[240px]"
        />
        <FilterSelect
          value={verification}
          onChange={setVerification}
          label="Verification"
          options={[
            { value: "VERIFIED", label: "Verified" },
            { value: "PENDING", label: "Pending" },
            { value: "REJECTED", label: "Rejected" },
          ]}
        />
      </FilterBar>

      {loading ? (
        <CardSkeletonGrid count={6} />
      ) : error ? (
        <p className="text-sm text-critical">
          {error} <Button variant="link" onClick={retry}>Retry</Button>
        </p>
      ) : filtered.length === 0 ? (
        <EmptyState title="No NGOs found" description="Try adjusting your search or filters." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((ngo) => (
            <article key={ngo.id} className="card-surface flex flex-col p-5">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
                  <Building2 className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-foreground">{ngo.name}</h3>
                  <p className="truncate text-xs text-muted-foreground">{ngo.location}</p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label={`Actions for ${ngo.name}`}>
                      <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setDetail(ngo)}>
                      <Eye className="h-4 w-4" aria-hidden="true" /> View details
                    </DropdownMenuItem>
                    {ngo.verification !== "VERIFIED" ? (
                      <DropdownMenuItem onClick={() => setConfirm({ ngo, action: "approve" })}>
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Approve
                      </DropdownMenuItem>
                    ) : null}
                    {ngo.verification !== "REJECTED" ? (
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setConfirm({ ngo, action: "reject" })}
                      >
                        <Ban className="h-4 w-4" aria-hidden="true" /> Reject
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{ngo.about}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <UserStatusBadge status={ngo.status} />
                <PresenceBadge online={ngo.isOnline ?? false} />
                <Badge variant="outline" className={verificationTone[ngo.verification]}>
                  {ngo.verification}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-1 text-sm">
                {/* <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Users className="h-3.5 w-3.5" aria-hidden="true" /> {ngo.rescuers} rescuers
                </span>
                <span className="text-muted-foreground">{ngo.cases} cases</span> */}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">Joined {formatDate(ngo.joinedAt)}</p>
            </article>
          ))}
        </div>
      )}

      <NgoDetailDialog ngo={detail} open={!!detail} onOpenChange={(v) => !v && setDetail(null)} />

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(v) => !v && setConfirm(null)}
        title={confirm?.action === "approve" ? "Approve this NGO?" : "Reject this NGO?"}
        description={
          confirm?.action === "approve"
            ? `${confirm.ngo.name} will be marked as a verified partner organization.`
            : `${confirm?.ngo.name}'s verification request will be rejected.`
        }
        confirmLabel={confirm?.action === "approve" ? "Approve" : "Reject"}
        destructive={confirm?.action === "reject"}
        onConfirm={applyAction}
      />
    </div>
  );
}
