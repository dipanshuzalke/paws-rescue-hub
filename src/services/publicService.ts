import { api, unwrap, unwrapList } from "@/lib/api-client";
import { adaptOrganization, adaptReport } from "@/lib/api-adapters";
import type { ApiOrganization, ApiReport } from "@/lib/api-adapters";

export const publicService = {
  async getRescueCases(params?: { page?: number; limit?: number; animalType?: string }) {
    const { items, pagination } = await unwrapList<ApiReport>(
      api.get("/public/rescue-cases", { params }),
    );
    return { items: items.map(adaptReport), pagination };
  },

  async getRescueCase(reportId: string) {
    return adaptReport(await unwrap<ApiReport>(api.get(`/public/rescue-cases/${reportId}`)));
  },

  async getOrganizations() {
    const { items } = await unwrapList<ApiOrganization>(api.get("/public/organizations"));
    return items.map(adaptOrganization);
  },

  getStats: () => unwrap<Record<string, number>>(api.get("/public/stats")),
};
