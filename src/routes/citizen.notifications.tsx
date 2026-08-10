import { createFileRoute } from "@tanstack/react-router";
import { Bell, CheckCheck, Info, Truck } from "lucide-react";
import { useMemo, useState } from "react";

import { EmptyState } from "@/components/shared/states";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { timeAgo } from "@/lib/format";
import { useApp } from "@/store/app-store";

export const Route = createFileRoute("/citizen/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · ResQ Paws" },
      { name: "description", content: "Stay updated on your rescue reports and system alerts." },
      { property: "og:title", content: "Notifications · ResQ Paws" },
      { property: "og:description", content: "Stay updated on your rescue reports and system alerts." },
    ],
  }),
  component: CitizenNotifications,
});

type TabKey = "all" | "unread" | "rescue" | "system";

function CitizenNotifications() {
  const { notifications, markRead, markAllRead } = useApp();
  const [tab, setTab] = useState<TabKey>("all");

  const mine = useMemo(
    () => notifications.filter((n) => n.role === "citizen" || n.role === "all"),
    [notifications],
  );

  const filtered = mine.filter((n) => {
    if (tab === "unread") return !n.read;
    if (tab === "rescue") return n.kind === "rescue" || n.kind === "assignment";
    if (tab === "system") return n.kind === "system";
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.filter((n) => !n.read).length} unread of {mine.length}
          </p>
        </div>
        <Button variant="outline" onClick={markAllRead}>
          <CheckCheck className="h-4 w-4" aria-hidden="true" />
          Mark all read
        </Button>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread</TabsTrigger>
          <TabsTrigger value="rescue">Rescue</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>
      </Tabs>

      {filtered.length === 0 ? (
        <EmptyState title="No notifications" description="You're all caught up." icon={Bell} />
      ) : (
        <div className="card-surface divide-y divide-border p-0">
          {filtered.map((n) => {
            const Icon = n.kind === "assignment" ? Truck : n.kind === "system" ? Info : Bell;
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => markRead(n.id)}
                className={cn(
                  "flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-muted/40",
                  !n.read && "bg-primary-soft/30",
                )}
              >
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-foreground">{n.title}</p>
                    {!n.read ? <span className="h-2 w-2 shrink-0 rounded-full bg-primary" aria-hidden="true" /> : null}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.body}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
