import { api, unwrap } from "@/lib/api-client";

export interface AnalyticsOverview {
  totalReports: number;
  activeRescues: number;
  completedRescues: number;
  criticalCases: number;
  avgResponseMins: number;
  avgRescueDurationMins: number;
}

export interface Bucket {
  label: string;
  value: number;
}

export interface MonthlyPoint {
  month: string;
  reports: number;
  rescued: number;
}

export interface PerformanceStats {
  avgResponseMins: number;
  avgAcceptanceMins: number;
  avgRescueDurationMins: number;
  avgTotalDurationMins: number;
  completionRate: number;
}

export interface ResponseTimePoint {
  month: string;
  minutes: number;
}

export const analyticsService = {
  getOverview: () => unwrap<AnalyticsOverview>(api.get("/analytics/overview")),
  getByAnimal: () => unwrap<Bucket[]>(api.get("/analytics/reports-by-animal")),
  getByStatus: () => unwrap<Bucket[]>(api.get("/analytics/reports-by-status")),
  getByPriority: () => unwrap<Bucket[]>(api.get("/analytics/reports-by-priority")),
  getMonthly: () => unwrap<MonthlyPoint[]>(api.get("/analytics/monthly")),
  getPerformance: () => unwrap<PerformanceStats>(api.get("/analytics/performance")),
  getResponseTimeTrend: () => unwrap<ResponseTimePoint[]>(api.get("/analytics/response-time-trend")),
  /** Convenience wrapper used by the dashboard stat cards. */
  getDashboardStats: () => unwrap<AnalyticsOverview>(api.get("/analytics/overview")),
};
