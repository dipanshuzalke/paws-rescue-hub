/**
 * Phase 1 service layer.
 *
 * Every function here returns mock data with a small simulated latency so the
 * UI exercises real loading states. In Phase 2 the bodies of these functions
 * are replaced with Axios calls to the Node.js + Express API; component code
 * does not have to change.
 */
import { mockActivity, mockNotifications } from "@/data/mockNotifications";
import { mockNGOs } from "@/data/mockNGOs";
import { mockReports } from "@/data/mockReports";
import { mockRescuers, mockUsers } from "@/data/mockUsers";
import type {
  ActivityEntry,
  AppNotification,
  NGO,
  RescueReport,
  Rescuer,
  User,
} from "@/types";

export const LATENCY = 450;

export function delay<T>(value: T, ms = LATENCY): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

export const getReports = (reports: RescueReport[] = mockReports) => delay(reports);

export const getReportById = (id: string, reports: RescueReport[] = mockReports) =>
  delay(reports.find((r) => r.id === id) ?? null);

export const getMyReports = (userId: string, reports: RescueReport[] = mockReports) =>
  delay(reports.filter((r) => r.reporterId === userId));

export const getAvailableRescues = (reports: RescueReport[] = mockReports) =>
  delay(reports.filter((r) => r.status === "REPORTED" || r.status === "ASSIGNED"));

export const getActiveRescues = (reports: RescueReport[] = mockReports) =>
  delay(reports.filter((r) => r.status === "ACCEPTED" || r.status === "IN_PROGRESS"));

export const getRescueHistory = (reports: RescueReport[] = mockReports) =>
  delay(
    reports.filter(
      (r) => r.status === "RESCUED" || r.status === "CLOSED" || r.status === "CANCELLED",
    ),
  );

export const getNotifications = (
  notifications: AppNotification[] = mockNotifications,
): Promise<AppNotification[]> => delay(notifications);

export const getUsers = (): Promise<User[]> => delay(mockUsers);

export const getRescuers = (): Promise<Rescuer[]> => delay(mockRescuers);

export const getNGOs = (): Promise<NGO[]> => delay(mockNGOs);

export const getActivity = (): Promise<ActivityEntry[]> => delay(mockActivity);

export const getAnalytics = () =>
  delay({
    generatedAt: new Date().toISOString(),
  });
/* ------------------------------------------------------------------ *
 * Phase 2 API services.
 *
 * When VITE_API_URL is set these hit the Express + MongoDB backend in
 * `backend/`; otherwise the mock helpers above keep the Phase 1 UI alive.
 * ------------------------------------------------------------------ */
export { authService } from "./authService";
export { userService } from "./userService";
export { reportService } from "./reportService";
export { rescueService } from "./rescueService";
export { ngoService } from "./ngoService";
export { adminService } from "./adminService";
export { notificationService } from "./notificationService";
export { analyticsService } from "./analyticsService";
export { publicService } from "./publicService";
export { isApiEnabled, apiErrorMessage } from "@/lib/api-client";
