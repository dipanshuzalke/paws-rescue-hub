import { API_URL, api, getToken, unwrap, unwrapList } from "@/lib/api-client";
import { adaptNotification } from "@/lib/api-adapters";
import type { ApiNotification } from "@/lib/api-adapters";
import type { AppNotification } from "@/types";

export const notificationService = {
  subscribe(onNotification: (notification: AppNotification) => void) {
    if (typeof window === "undefined") return () => undefined;

    const controller = new AbortController();
    let retryTimer: number | undefined;
    let stopped = false;

    const connect = async () => {
      try {
        const token = getToken();
        const response = await fetch(`${API_URL || "/api"}/notifications/stream`, {
          headers: {
            Accept: "text/event-stream",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        });
        if (!response.ok || !response.body) throw new Error("Notification stream unavailable");

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (!stopped) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split("\n\n");
          buffer = events.pop() ?? "";
          for (const event of events) {
            const data = event
              .split("\n")
              .find((line) => line.startsWith("data: "))
              ?.slice(6);
            if (!data) continue;
            try {
              onNotification(adaptNotification(JSON.parse(data) as ApiNotification));
            } catch {
              // Ignore malformed events and keep the connection alive.
            }
          }
        }
      } catch {
        // Retry below unless the signed-in user has navigated away or logged out.
      }

      if (!stopped) retryTimer = window.setTimeout(() => void connect(), 3_000);
    };

    void connect();
    return () => {
      stopped = true;
      if (retryTimer) window.clearTimeout(retryTimer);
      controller.abort();
    };
  },

  async getNotifications(params?: { page?: number; limit?: number; isRead?: boolean }) {
    const { items, pagination } = await unwrapList<ApiNotification>(
      api.get("/notifications", { params }),
    );
    return { items: items.map((n) => adaptNotification(n)), pagination };
  },

  async getUnread(): Promise<{ items: AppNotification[]; count: number }> {
    const data = await unwrap<{ items: ApiNotification[]; count: number }>(
      api.get("/notifications/unread"),
    );
    return { items: (data.items ?? []).map((n) => adaptNotification(n)), count: data.count ?? 0 };
  },

  async markRead(id: string): Promise<void> {
    await api.patch(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    await api.patch("/notifications/read-all");
  },

  async remove(id: string): Promise<void> {
    await api.delete(`/notifications/${id}`);
  },
};
