import { api, unwrap, unwrapList } from "@/lib/api-client";
import type { Paginated } from "@/lib/api-client";
import { adaptReport, adaptUser } from "@/lib/api-adapters";
import type { ApiReport, ApiUser } from "@/lib/api-adapters";
import type { RescueReport, RescueStatus, User } from "@/types";
import type { ReportQuery } from "./reportService";

export interface RescuerStats {
  availableRequests: number;
  activeRescues: number;
  completedRescues: number;
  criticalCases: number;
  avgResponseMins: number;
  rating: number;
  ratedResponses: number;
}

async function adaptedList(url: string, query?: ReportQuery): Promise<Paginated<RescueReport>> {
  const { items, pagination } = await unwrapList<ApiReport>(api.get(url, { params: query }));
  return { items: items.map(adaptReport), pagination };
}

export const rescueService = {
  getAvailableRequests: (query?: ReportQuery) => adaptedList("/rescues/available", query),
  getActiveRescues: (query?: ReportQuery) => adaptedList("/rescues/active", query),
  getHistory: (query?: ReportQuery) => adaptedList("/rescues/history", query),
  getMyActive: (query?: ReportQuery) => adaptedList("/rescues/my-active", query),
  getMyHistory: (query?: ReportQuery) => adaptedList("/rescues/my-history", query),

  getRescuerStats: () => unwrap<RescuerStats>(api.get("/rescues/rescuer-stats")),

  async getRescueById(id: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.get(`/rescues/${id}`)));
  },

  async acceptRescue(reportId: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.post(`/rescues/${reportId}/accept`)));
  },

  async updateStatus(reportId: string, status: RescueStatus, note?: string): Promise<RescueReport> {
    return adaptReport(
      await unwrap<ApiReport>(api.put(`/rescues/${reportId}/status`, { status, note })),
    );
  },

  async addNote(reportId: string, text: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.post(`/reports/${reportId}/notes`, { text })));
  },
  
  async uploadProof(reportId: string, files: File[], note?: string): Promise<RescueReport> {
    const form = new FormData();
    files.forEach((f) => form.append("images", f));
    if (note) form.append("note", note);
    return adaptReport(
      await unwrap<ApiReport>(
        api.post(`/rescues/${reportId}/proof`, form, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      ),
    );
  },

  async setAvailability(availability: "AVAILABLE" | "BUSY" | "OFFLINE"): Promise<User> {
    const data = await unwrap<{ user: ApiUser }>(
      api.patch("/rescues/availability", { availability }),
    );
    return adaptUser(data.user);
  },
};
