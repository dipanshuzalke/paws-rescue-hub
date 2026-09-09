import { api, unwrap, unwrapList } from "@/lib/api-client";
import {
  adaptOrganization,
  adaptReport,
  adaptRescuer,
  adaptUser,
  toApiRole,
} from "@/lib/api-adapters";
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
    const { items, pagination } = await unwrapList<ApiUser>(
      api.get("/admin/rescuers", { params: query }),
    );
    return { items: items.map(adaptRescuer), pagination };
  },

  async getReports(query?: ReportQuery) {
    const { items, pagination } = await unwrapList<ApiReport>(
      api.get("/admin/reports", { params: query }),
    );
    return { items: items.map(adaptReport), pagination };
  },

  async getNgos(
    query: { search?: string; verificationStatus?: string; page?: number; limit?: number } = {},
  ) {
    const { items, pagination } = await unwrapList<ApiOrganization>(
      api.get("/admin/ngos", { params: query }),
    );
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
    type RawActivityEntry = {
      id: string;
      at: string;
      actor: string;
      action: string;
      target?: unknown;
      kind: ActivityEntry["kind"] | "REPORT_STATUS";
    };

    const { items } = await unwrapList<RawActivityEntry>(
      api.get("/admin/activity", {
        params: { limit },
      }),
    );

    const actionLabels: Record<string, string> = {
      REPORTED: "reported",
      ASSIGNED: "assigned",
      ACCEPTED: "accepted",
      IN_PROGRESS: "started",
      RESCUED: "completed",
      CLOSED: "closed",
    };

    return items.map((entry): ActivityEntry => {
      // -----------------------------
      // Activity kind
      // -----------------------------
      let kind: ActivityEntry["kind"];

      if (entry.kind === "REPORT_STATUS") {
        switch (entry.action) {
          case "ASSIGNED":
            kind = "assign";
            break;

          case "ACCEPTED":
            kind = "accept";
            break;

          case "IN_PROGRESS":
          case "RESCUED":
          case "CLOSED":
            kind = "rescue";
            break;

          default:
            kind = "report";
        }
      } else {
        kind = entry.kind;
      }

      // -----------------------------
      // Extract information from target
      // -----------------------------
      let target = "rescue report";

      if (typeof entry.target === "string") {
        const rawTarget = entry.target;

        const animalMatch = rawTarget.match(/animalType:\s*['"]([^'"]+)['"]/i);

        const reportIdMatch = rawTarget.match(
          /(?:id|_id):\s*(?:new ObjectId\()?['"]?([a-fA-F0-9]{20,})['"]?\)?/i,
        );

        const animalType = animalMatch?.[1]?.toLowerCase().replaceAll("_", " ");

        const reportId = reportIdMatch?.[1];

        if (animalType && reportId) {
          target = `${animalType} rescue report (#${reportId.slice(-6).toUpperCase()})`;
        } else if (animalType) {
          target = `${animalType} rescue report`;
        } else if (reportId) {
          target = `rescue report (#${reportId.slice(-6).toUpperCase()})`;
        }
      } else if (entry.target !== null && typeof entry.target === "object") {
        const raw = entry.target as {
          id?: string;
          _id?: string;
          animalType?: string;
        };

        const reportId = raw.id ?? raw._id;

        if (raw.animalType && reportId) {
          target = `${raw.animalType.toLowerCase().replaceAll("_", " ")} rescue report (#${String(
            reportId,
          )
            .slice(-6)
            .toUpperCase()})`;
        } else if (raw.animalType) {
          target = `${raw.animalType.toLowerCase().replaceAll("_", " ")} rescue report`;
        } else if (reportId) {
          target = `rescue report (#${String(reportId).slice(-6).toUpperCase()})`;
        }
      }
      
      const action = actionLabels[entry.action] ?? entry.action.toLowerCase().replaceAll("_", " ");

      return {
        id: entry.id,
        at: entry.at,
        actor: entry.actor,
        action,
        target,
        kind,
      };
    });
  },
};
