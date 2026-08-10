import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

import { STATUS_LABELS, buildTimeline, mockReports } from "@/data/mockReports";
import { mockNotifications } from "@/data/mockNotifications";
import { demoAccounts, mockUsers } from "@/data/mockUsers";
import type {
  AppNotification,
  RescueReport,
  RescueStatus,
  Role,
  User,
} from "@/types";

interface NewReportInput {
  animal: RescueReport["animal"];
  count: number;
  condition: RescueReport["condition"];
  emergency: RescueReport["emergency"];
  description: string;
  address: string;
  area: string;
  images: string[];
  coords: { lat: number; lng: number };
}

interface AppState {
  user: User | null;
  role: Role | null;
  reports: RescueReport[];
  notifications: AppNotification[];
  unreadCount: number;
  loginAs: (role: Role) => User;
  logout: () => void;
  createReport: (input: NewReportInput) => RescueReport;
  assignRescuer: (reportId: string, rescuerId: string, rescuerName: string, ngo?: string) => void;
  updateStatus: (reportId: string, status: RescueStatus, note?: string) => void;
  addNote: (reportId: string, text: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteReport: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = "resqpaws.demo.v1";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<RescueReport[]>(mockReports);
  const [notifications, setNotifications] = useState<AppNotification[]>(mockNotifications);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { user?: User; reports?: RescueReport[] };
        if (parsed.user) setUser(parsed.user);
        if (parsed.reports?.length) setReports(parsed.reports);
      }
    } catch {
      /* demo storage is best-effort */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, reports }));
    } catch {
      /* ignore */
    }
  }, [user, reports, hydrated]);

  const loginAs = useCallback((role: Role) => {
    const account = demoAccounts.find((a) => a.role === role)!;
    const found = mockUsers.find((u) => u.id === account.userId)!;
    setUser(found);
    return found;
  }, []);

  const logout = useCallback(() => setUser(null), []);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "at" | "read">) => {
    setNotifications((prev) => [
      { ...n, id: `N-${Date.now()}`, at: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const createReport = useCallback(
    (input: NewReportInput) => {
      const nextNumber = 1024 + reports.filter((r) => r.id.startsWith("R10")).length;
      const id = `R${Math.max(1048, nextNumber)}`;
      const now = new Date().toISOString();
      const reporter = user ?? mockUsers[0]!;
      const report: RescueReport = {
        id,
        animal: input.animal,
        count: input.count,
        condition: input.condition,
        emergency: input.emergency,
        status: "REPORTED",
        title: `${input.condition} ${input.animal}`,
        description: input.description,
        images: input.images,
        address: input.address,
        area: input.area,
        city: "Nagpur",
        coords: input.coords,
        distanceKm: Number((Math.random() * 4 + 0.6).toFixed(1)),
        reporterId: reporter.id,
        reporterName: reporter.name,
        reporterPhone: reporter.phone,
        createdAt: now,
        updatedAt: now,
        timeline: buildTimeline("REPORTED", now, { reporter: reporter.name }),
        notes: [],
      };
      setReports((prev) => [report, ...prev]);
      pushNotification({
        title: "Report submitted successfully",
        body: `Rescue request #${id} for a ${input.condition.toLowerCase()} ${input.animal.toLowerCase()} in ${input.area} was received.`,
        kind: "rescue",
        emergency: input.emergency,
        role: "citizen",
        link: `/citizen/reports/${id}`,
      });
      pushNotification({
        title:
          input.emergency === "CRITICAL"
            ? "New critical rescue request"
            : "New rescue request nearby",
        body: `${input.condition} ${input.animal.toLowerCase()} reported in ${input.area}, Nagpur.`,
        kind: "rescue",
        emergency: input.emergency,
        role: "rescuer",
        link: `/rescuer/requests/${id}`,
      });
      return report;
    },
    [pushNotification, reports, user],
  );

  const mutate = useCallback((id: string, fn: (r: RescueReport) => RescueReport) => {
    setReports((prev) => prev.map((r) => (r.id === id ? fn(r) : r)));
  }, []);

  const assignRescuer = useCallback(
    (reportId: string, rescuerId: string, rescuerName: string, ngo?: string) => {
      mutate(reportId, (r) => {
        const now = new Date().toISOString();
        return {
          ...r,
          status: "ASSIGNED",
          rescuerId,
          rescuerName,
          ngoName: ngo ?? r.ngoName,
          updatedAt: now,
          timeline: r.timeline.map((t) =>
            t.status === "ASSIGNED" ? { ...t, at: now, by: ngo ?? "Coordination desk" } : t,
          ),
        };
      });
      pushNotification({
        title: "New assignment received",
        body: `You have been assigned to rescue #${reportId}.`,
        kind: "assignment",
        role: "rescuer",
        link: `/rescuer/requests/${reportId}`,
      });
    },
    [mutate, pushNotification],
  );

  const updateStatus = useCallback(
    (reportId: string, status: RescueStatus, note?: string) => {
      mutate(reportId, (r) => {
        const now = new Date().toISOString();
        const hasStep = r.timeline.some((t) => t.status === status);
        const timeline = hasStep
          ? r.timeline.map((t) => (t.status === status ? { ...t, at: now, note } : t))
          : [
              ...r.timeline,
              { status, label: STATUS_LABELS[status], at: now, note },
            ];
        return {
          ...r,
          status,
          updatedAt: now,
          closedAt: status === "CLOSED" ? now : r.closedAt,
          durationMins:
            status === "RESCUED" || status === "CLOSED"
              ? Math.max(
                  15,
                  Math.round((Date.now() - new Date(r.createdAt).getTime()) / 60000) % 400,
                )
              : r.durationMins,
          timeline,
        };
      });
      pushNotification({
        title: `Rescue ${STATUS_LABELS[status].toLowerCase()}`,
        body: `Rescue #${reportId} is now marked as ${STATUS_LABELS[status]}.`,
        kind: "rescue",
        role: "citizen",
        link: `/citizen/reports/${reportId}`,
      });
    },
    [mutate, pushNotification],
  );

  const addNote = useCallback(
    (reportId: string, text: string) => {
      mutate(reportId, (r) => ({
        ...r,
        notes: [
          ...r.notes,
          {
            id: `${reportId}-N${r.notes.length + 1}`,
            author: user?.name ?? "Rescue team",
            role: user?.role ?? "rescuer",
            at: new Date().toISOString(),
            text,
          },
        ],
      }));
    },
    [mutate, user],
  );

  const markRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteReport = useCallback((id: string) => {
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      user,
      role: user?.role ?? null,
      reports,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      loginAs,
      logout,
      createReport,
      assignRescuer,
      updateStatus,
      addNote,
      markRead,
      markAllRead,
      deleteReport,
    }),
    [
      user,
      reports,
      notifications,
      loginAs,
      logout,
      createReport,
      assignRescuer,
      updateStatus,
      addNote,
      markRead,
      markAllRead,
      deleteReport,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}