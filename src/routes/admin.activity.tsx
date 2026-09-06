import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";

import { ActivityList } from "@/components/admin/activity-list";
import { FilterBar, FilterSelect, SearchBar } from "@/components/shared/filter-bar";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/states";
import { useAsync } from "@/hooks/use-async";
import { getActivity } from "@/services";
import { adminService } from "@/services/adminService";
import { useApp } from "@/store/app-store";
import type { ActivityEntry } from "@/types";

export const Route = createFileRoute("/admin/activity")({
  head: () => ({
    meta: [
      { title: "System Activity · ResQ Paws Admin" },
      {
        name: "description",
        content: "Audit trail of reports, assignments, rescues and account changes.",
      },
      { property: "og:title", content: "System Activity · ResQ Paws Admin" },
      {
        property: "og:description",
        content: "Full activity log across users, NGOs and rescue cases on ResQ Paws.",
      },
    ],
  }),
  component: AdminActivity,
});

const kindOptions: { value: ActivityEntry["kind"]; label: string }[] = [
  { value: "report", label: "Reports" },
  { value: "assign", label: "Assignments" },
  { value: "accept", label: "Acceptances" },
  { value: "rescue", label: "Rescues" },
  { value: "user", label: "Users" },
  { value: "ngo", label: "NGOs" },
];

function AdminActivity() {
  const { apiMode } = useApp();
  const { data, loading } = useAsync(
    () => (apiMode ? adminService.getActivity(100) : getActivity()),
    [apiMode],
  );
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("all");

  const list = data ?? [];

  const filtered = useMemo(() => {
    return list
      .filter((e) => (kind === "all" ? true : e.kind === kind))
      .filter((e) => {
        const q = search.trim().toLowerCase();
        if (!q) return true;
        return (
          e.actor.toLowerCase().includes(q) ||
          e.action.toLowerCase().includes(q) ||
          e.target.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [list, kind, search]);

  return (
    <div className="space-y-6">
      <PageHeader title="System Activity" description="Audit trail of everything happening on ResQ Paws." />
      <FilterBar>
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by actor, action or target…"
          className="flex-1 sm:min-w-60"
        />
        <FilterSelect value={kind} onChange={setKind} label="Type" options={kindOptions} />
      </FilterBar>

      <div className="card-surface min-w-0 overflow-hidden p-5">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState title="No activity found" description="Try adjusting your search or filters." />
        ) : (
          <ActivityList entries={filtered} />
        )}
      </div>
    </div>
  );
}
