import { createFileRoute } from "@tanstack/react-router";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { PriorityBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/ngo/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · ResQ Paws NGO" },
      { name: "description", content: "Stay updated on new requests, assignments and system alerts." },
      { property: "og:title", content: "Notifications · ResQ Paws NGO" },
      {
        property: "og:description",
        content: "Track rescue requests, assignments and system alerts for your organization.",
      },
    ],
  }),
  component: NgoNotifications,
});

type Tab = "all" | "unread" | "rescue" | "assignment" | "system";

function NgoNotifications() {
  const { notifications, markRead, markAllRead } = useApp();
  const [tab, setTab] = useState<Tab>("all");

  const mine = useMemo(
    () => notifications.filter((n) => n.role === "ngo" || n.role === "all"),
    [notifications],
  );

  const filtered = useMemo(() => {
    if (tab === "unread") return mine.filter((n) => !n.read);
    if (tab === "rescue") return mine.filter((n) => n.kind === "rescue");
    if (tab === "assignment") return mine.filter((n) => n.kind === "assignment");
    if (tab === "system") return mine.filter((n) => n.kind === "system");
    return mine;
  }, [mine, tab]);

  const unreadCount = mine.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Requests, assignments and system alerts for your organization."
        actions={
          <Button variant="outline" onClick={markAllRead} disabled={unreadCount === 0}>
            <CheckCheck className="h-4 w-4" aria-hidden="true" /> Mark all read
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="rescue">Rescues</TabsTrigger>
          <TabsTrigger value="assignment">Assignments</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState icon={Bell} title="No notifications" description="You're all caught up." />
      ) : (
        <ul className="space-y-2">
          {filtered.map((n) => (
            <li
              key={n.id}
              className={cn(
                "card-surface flex items-start gap-3 p-4",
                !n.read && "border-primary/30 bg-primary-soft/20",
              )}
            >
              <span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
                <Bell className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                  {n.emergency ? <PriorityBadge level={n.emergency} /> : null}
                </div>
                <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
              </div>
              {!n.read ? (
                <Button
                  size="sm"
                  variant="ghost"
                  aria-label="Mark as read"
                  onClick={() => markRead(n.id)}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
