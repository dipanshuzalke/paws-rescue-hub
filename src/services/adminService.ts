import { api, unwrap, unwrapList } from "@/lib/api-client";
import { adaptOrganization, adaptReport, adaptRescuer, adaptUser, toApiRole } from "@/lib/api-adapters";
import type { ApiOrganization, ApiReport, ApiUser } from "@/lib/api-adapters";
import type { ActivityEntry, Role, UserStatus } from "@/types";
import type { ReportQuery } from "./reportService";

export interface AdminStats {
  totalUsers: number;
  citizens: number;
  rescuers: number;
  ngos: number;
  totalReports: number;
  activeRescues: number;
  completedRescues: number;
  criticalCases: number;
}

export interface UserQuery {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  limit?: number;
}

export const adminService = {
  getStats: () => unwrap<AdminStats>(api.get("/admin/stats")),

  async getUsers(query: UserQuery = {}) {
    const params = { ...query, role: query.role ? toApiRole(query.role) : undefined };
    const { items, pagination } = await unwrapList<ApiUser>(api.get("/admin/users", { params }));
    return { items: items.map(adaptUser), pagination };
  },

  async getUserById(id: string) {
    return adaptUser(await unwrap<ApiUser>(api.get(`/admin/users/${id}`)));
  },

  async updateUser(id: string, patch: Record<string, unknown>) {
    return adaptUser(await unwrap<ApiUser>(api.put(`/admin/users/${id}`, patch)));
  },

  async setUserStatus(id: string, status: UserStatus) {
    return adaptUser(await unwrap<ApiUser>(api.patch(`/admin/users/${id}/status`, { status })));
  },

  async getRescuers(query: UserQuery = {}) {
    const { items, pagination } = await unwrapList<ApiUser>(api.get("/admin/rescuers", { params: query }));
    return { items: items.map(adaptRescuer), pagination };
  },

  async getReports(query?: ReportQuery) {
    const { items, pagination } = await unwrapList<ApiReport>(api.get("/admin/reports", { params: query }));
    return { items: items.map(adaptReport), pagination };
  },

  async getNgos(query: { search?: string; verificationStatus?: string; page?: number; limit?: number } = {}) {
    const { items, pagination } = await unwrapList<ApiOrganization>(api.get("/admin/ngos", { params: query }));
    return { items: items.map(adaptOrganization), pagination };
  },

  async getNgoById(id: string) {
    return adaptOrganization(await unwrap<ApiOrganization>(api.get(`/admin/ngos/${id}`)));
  },

  async verifyNgo(id: string) {
    return adaptOrganization(await unwrap<ApiOrganization>(api.patch(`/admin/ngos/${id}/verify`)));
  },

  async rejectNgo(id: string, reason?: string) {
    return adaptOrganization(
      await unwrap<ApiOrganization>(api.patch(`/admin/ngos/${id}/reject`, { reason })),
    );
  },

  async getActivity(limit = 20) {
    const { items } = await unwrapList<
      Omit<ActivityEntry, "kind"> & { kind: ActivityEntry["kind"] | "REPORT_STATUS" }
    >(api.get("/admin/activity", { params: { limit } }));
    return items.map((entry): ActivityEntry => ({
      ...entry,
      kind:
        entry.kind === "REPORT_STATUS"
          ? entry.action === "ASSIGNED"
            ? "assign"
            : entry.action === "ACCEPTED"
              ? "accept"
              : entry.action === "IN_PROGRESS" || entry.action === "RESCUED" || entry.action === "CLOSED"
                ? "rescue"
                : "report"
          : entry.kind,
    }));
  },
};
