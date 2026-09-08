import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";

import { STATUS_LABELS, buildTimeline, mockReports } from "@/data/mockReports";
import { mockNotifications } from "@/data/mockNotifications";
import { demoAccounts, mockUsers } from "@/data/mockUsers";
import { isApiEnabled, apiErrorMessage } from "@/lib/api-client";
import { authService } from "@/services/authService";
import { reportService } from "@/services/reportService";
import { rescueService } from "@/services/rescueService";
import { ngoService } from "@/services/ngoService";
import { notificationService } from "@/services/notificationService";
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
  description?: string;
  contactPhone: string,
  address: string;
  area: string;
  images: string[];
  files?: File[];
  coords: { lat: number; lng: number };
  /** Phase 3 — records that the citizen saw and dismissed a duplicate warning. */
  duplicateWarningShown?: boolean;
}

interface AppState {
  user: User | null;
  role: Role | null;
  reports: RescueReport[];
  notifications: AppNotification[];
  unreadCount: number;
  /** True when VITE_API_URL is configured and the Express backend is in use. */
  apiMode: boolean;
  authReady: boolean;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateAvailability: (availability: NonNullable<User["availability"]>) => Promise<User | null>;
  signIn: (email: string, password: string) => Promise<User>;
  signUp: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: Role;
    organizationName?: string;
    organizationDescription?: string;
  }) => Promise<User>;
  loginAs: (role: Role) => Promise<User>;
  logout: () => Promise<void>;
  createReport: (input: NewReportInput) => Promise<RescueReport>;
  assignRescuer: (
    reportId: string,
    rescuerId: string,
    rescuerName: string,
    ngo?: string,
  ) => Promise<void>;
  updateStatus: (reportId: string, status: RescueStatus, note?: string) => void;
  addNote: (reportId: string, text: string) => void;
  markRead: (id: string) => void;
  markAllRead: () => void;
  deleteReport: (id: string) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = "resqpaws.demo.v1";

/** Password used by the seeded demo accounts (see backend/src/seed/seed.js). */
const DEMO_PASSWORD = "demo1234";

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [reports, setReports] = useState<RescueReport[]>(isApiEnabled ? [] : mockReports);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    isApiEnabled ? [] : mockNotifications,
  );
  const [hydrated, setHydrated] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const authVersion = useRef(0);

  useEffect(() => {
    if (isApiEnabled) {
      setHydrated(true);
      return;
    }
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
    setAuthReady(true);
  }, []);

  useEffect(() => {
    if (!hydrated || isApiEnabled) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, reports }));
    } catch {
      /* ignore */
    }
  }, [user, reports, hydrated]);

  /** Pulls the data visible to the signed-in role from the Express API. */
  const loadFor = useCallback(async (current: User | null) => {
    if (!isApiEnabled || !current) return;
    setLoading(true);
    setError(null);
    try {
      const [reportResult, notificationResult] = await Promise.allSettled([
        current.role === "citizen"
          ? reportService.getMyReports({ limit: 100 })
          : current.role === "rescuer"
            ? Promise.all([
                rescueService.getAvailableRequests({ limit: 100 }),
                rescueService.getActiveRescues({ limit: 100 }),
                rescueService.getHistory({ limit: 100 }),
              ]).then(([available, active, history]) => ({
                items: Array.from(
                  new Map(
                    [...available.items, ...active.items, ...history.items].map((report) => [
                      report.id,
                      report,
                    ]),
                  ).values(),
                ),
                pagination: available.pagination,
              }))
            : current.role === "ngo"
              ? ngoService.getReports({ limit: 100 })
              : reportService.getReports({ limit: 100 }),
        notificationService.getNotifications({ limit: 50 }),
      ]);
      if (reportResult.status === "fulfilled") {
        setReports(reportResult.value.items);
      } else {
        setReports([]);
        setError(apiErrorMessage(reportResult.reason));
      }
      if (notificationResult.status === "fulfilled") {
        setNotifications(notificationResult.value.items);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => loadFor(user), [loadFor, user]);

  const updateAvailability = useCallback(
    async (availability: NonNullable<User["availability"]>) => {
      if (isApiEnabled) {
        const updated = await rescueService.setAvailability(
          availability === "Available" ? "AVAILABLE" : availability === "Busy" ? "BUSY" : "OFFLINE",
        );
        setUser(updated);
        return updated;
      }

      let updated: User | null = null;
      setUser((current) => {
        updated = current ? { ...current, availability } : null;
        return updated;
      });
      return updated;
    },
    [],
  );

  // Restore the JWT session on first load when the backend is configured.
  useEffect(() => {
    if (!isApiEnabled) return;
    const restoreVersion = authVersion.current;
    let cancelled = false;
    void (async () => {
      try {
        const me = await authService.me();
        if (cancelled || restoreVersion !== authVersion.current) return;
        setUser(me);
        await loadFor(me);
      } catch {
        /* no active session — the login page handles it */
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadFor]);

  useEffect(() => {
    if (!isApiEnabled || !user) return;
    void authService.heartbeat();
    const interval = window.setInterval(() => {
      void authService.heartbeat();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [isApiEnabled, user]);

  useEffect(() => {
    if (!isApiEnabled || !user) return;
    const refreshNotifications = () => {
      void notificationService
        .getNotifications({ limit: 50 })
        .then((result) => setNotifications(result.items))
        .catch(() => undefined);
    };
    refreshNotifications();
    const interval = window.setInterval(refreshNotifications, 5_000);
    return () => window.clearInterval(interval);
  }, [isApiEnabled, user]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!isApiEnabled) {
        const account = demoAccounts.find((a) => a.email === email.trim().toLowerCase());
        if (!account) throw new Error("Use one of the demo accounts listed below.");
        const found = mockUsers.find((u) => u.id === account.userId)!;
        setUser(found);
        return found;
      }
      const me = await authService.login(email.trim().toLowerCase(), password);
      setUser(me);
      setReports([]);
      setNotifications([]);
      await loadFor(me);
      return me;
    },
    [loadFor],
  );

  const signUp = useCallback(
    async (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
      role: Role;
      organizationName?: string;
      organizationDescription?: string;
    }) => {
      if (!isApiEnabled) {
        const account = demoAccounts.find((a) => a.role === input.role)!;
        const found = { ...mockUsers.find((u) => u.id === account.userId)!, name: input.name };
        setUser(found);
        return found;
      }
      const me = await authService.register(input);
      setUser(me);
      setReports([]);
      setNotifications([]);
      await loadFor(me);
      return me;
    },
    [loadFor],
  );

  const loginAs = useCallback(async (role: Role) => {
    const account = demoAccounts.find((a) => a.role === role)!;
    if (isApiEnabled) {
      const me = await authService.login(account.email, DEMO_PASSWORD);
      setUser(me);
      setReports([]);
      setNotifications([]);
      await loadFor(me);
      return me;
    }
    const found = mockUsers.find((u) => u.id === account.userId)!;
    setUser(found);
    return found;
  }, [loadFor]);

  const logout = useCallback(async () => {
    authVersion.current += 1;
    if (isApiEnabled) {
      setReports([]);
      setNotifications([]);
      try {
        await authService.logout();
      } finally {
        setUser(null);
      }
      return;
    }
    setUser(null);
  }, []);

  const pushNotification = useCallback((n: Omit<AppNotification, "id" | "at" | "read">) => {
    setNotifications((prev) => [
      { ...n, id: `N-${Date.now()}`, at: new Date().toISOString(), read: false },
      ...prev,
    ]);
  }, []);

  const createReport = useCallback(
    async (input: NewReportInput) => {
      if (isApiEnabled) {
        const created = await reportService.createReport({
          animal: input.animal,
          count: input.count,
          condition: input.condition,
          emergency: input.emergency,
          description: input.description ?? "",
          contactPhone: input.contactPhone,
          address: input.address,
          area: input.area,
          coords: input.coords,
          files: input.files ?? [],
          ...(input.duplicateWarningShown !== undefined
            ? { duplicateWarningShown: input.duplicateWarningShown }
            : {}),
        });
        setReports((prev) => [created, ...prev]);
        return created;
      }
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
        description: input.description ?? "",
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
    async (reportId: string, rescuerId: string, rescuerName: string, ngo?: string) => {
      if (isApiEnabled) {
        try {
          const updated = await ngoService.assignRescuer(reportId, rescuerId);
          setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
        } catch (err) {
          setError(apiErrorMessage(err));
          throw err;
        }
        return;
      }
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
      return Promise.resolve();
    },
    [mutate, pushNotification],
  );

  const updateStatus = useCallback(
    (reportId: string, status: RescueStatus, note?: string) => {
      if (isApiEnabled) {
        const call =
          status === "ACCEPTED"
            ? rescueService.acceptRescue(reportId)
            : rescueService.updateStatus(reportId, status, note);
        void call
          .then((updated) =>
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r))),
          )
          .catch((err) => setError(apiErrorMessage(err)));
        return;
      }
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
      if (isApiEnabled) {
        void rescueService
          .addNote(reportId, text)
          .then((updated) =>
            setReports((prev) => prev.map((r) => (r.id === updated.id ? updated : r))),
          )
          .catch((err) => setError(apiErrorMessage(err)));
        return;
      }
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
    if (isApiEnabled) void notificationService.markRead(id).catch(() => undefined);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, []);

  const markAllRead = useCallback(() => {
    if (isApiEnabled) void notificationService.markAllRead().catch(() => undefined);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const deleteReport = useCallback((id: string) => {
    if (isApiEnabled) void reportService.deleteReport(id).catch(() => undefined);
    setReports((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const value = useMemo<AppState>(
    () => ({
      user,
      role: user?.role ?? null,
      reports,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      apiMode: isApiEnabled,
      authReady,
      loading,
      error,
      refresh,
      updateAvailability,
      signIn,
      signUp,
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
      loading,
      authReady,
      error,
      refresh,
      updateAvailability,
      signIn,
      signUp,
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