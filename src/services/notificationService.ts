import { api, unwrap, unwrapList } from "@/lib/api-client";
import { adaptNotification } from "@/lib/api-adapters";
import type { ApiNotification } from "@/lib/api-adapters";
import type { AppNotification } from "@/types";

export const notificationService = {
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
