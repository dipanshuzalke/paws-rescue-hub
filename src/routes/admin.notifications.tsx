import { createFileRoute } from "@tanstack/react-router";

import { EmptyState } from "@/components/shared/states";
import { useApp } from "@/store/app-store";
import { timeAgo } from "@/lib/format";

export const Route = createFileRoute("/admin/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications · ResQ Paws Admin" },
      { name: "description", content: "System alerts and rescue activity notifications for administrators." },
      { property: "og:title", content: "Notifications · ResQ Paws Admin" },
      { property: "og:description", content: "System alerts and rescue activity notifications for administrators." },
    ],
  }),
  component: AdminNotifications,
});

function AdminNotifications() {
  const { notifications } = useApp();
  const items = notifications.filter((n) => n.role === "admin" || n.role === "all");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Notifications</h1>
        <p className="mt-1 text-sm text-muted-foreground">System alerts and platform-wide rescue activity.</p>
      </div>
      {items.length === 0 ? (
        <EmptyState title="No notifications" description="System alerts will appear here." />
      ) : (
        <div className="card-surface divide-y divide-border p-0">
          {items.map((n) => (
            <div key={n.id} className="p-4">
              <p className="text-sm font-semibold text-foreground">{n.title}</p>
              <p className="text-xs text-muted-foreground">{n.body}</p>
              <p className="mt-1 text-xs text-muted-foreground">{timeAgo(n.at)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
