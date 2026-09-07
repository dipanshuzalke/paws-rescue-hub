import { api, unwrap, unwrapList } from "@/lib/api-client";
import { adaptOrganization, adaptReport, adaptRescuer } from "@/lib/api-adapters";
import type { ApiOrganization, ApiReport, ApiUser } from "@/lib/api-adapters";
import type { ReportQuery } from "./reportService";

export interface NgoStats {
  totalRequests: number;
  unassigned: number;
  activeRescues: number;
  completedRescues: number;
  criticalCases: number;
  rescuers: number;
}

export const ngoService = {
  getProfile: async () => adaptOrganization(await unwrap<ApiOrganization>(api.get("/ngo/profile"))),

  updateProfile: async (patch: Partial<ApiOrganization>) =>
    adaptOrganization(await unwrap<ApiOrganization>(api.put("/ngo/profile", patch))),

  getStats: () => unwrap<NgoStats>(api.get("/ngo/stats")),

  async getReports(query?: ReportQuery) {
    const { items, pagination } = await unwrapList<ApiReport>(api.get("/ngo/reports", { params: query }));
    return { items: items.map(adaptReport), pagination };
  },

  async getActiveRescues(query?: ReportQuery) {
    const { items, pagination } = await unwrapList<ApiReport>(
      api.get("/ngo/active-rescues", { params: query }),
    );
    return { items: items.map(adaptReport), pagination };
  },

  async getHistory(query?: ReportQuery) {
    const { items, pagination } = await unwrapList<ApiReport>(api.get("/ngo/history", { params: query }));
    return { items: items.map(adaptReport), pagination };
  },

  async getRescuers(query?: { search?: string; availability?: string; page?: number; limit?: number }) {
    const { items, pagination } = await unwrapList<ApiUser>(api.get("/ngo/rescuers", { params: query }));
    return { items: items.map(adaptRescuer), pagination };
  },

  async assignRescuer(reportId: string, rescuerId: string, notes?: string) {
    return adaptReport(
      await unwrap<ApiReport>(api.post("/ngo/assignments", { reportId, rescuerId, notes })),
    );
  },

  getAnalytics: () => unwrap<Record<string, unknown>>(api.get("/ngo/analytics")),
};
