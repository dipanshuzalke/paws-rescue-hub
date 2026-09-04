import axios from "axios";
import type { AxiosError, AxiosInstance } from "axios";

/**
 * Centralised API client for the Phase 2 Express backend.
 *
 * When VITE_API_URL is not set the app stays in Phase 1 demo mode and keeps
 * using the bundled mock data — see `isApiEnabled` below.
 */
export const API_URL: string = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "";

export const isApiEnabled = Boolean(API_URL);

const TOKEN_KEY = "resqpaws.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage unavailable */
  }
}

export const api: AxiosInstance = axios.create({
  baseURL: API_URL || "/api",
  withCredentials: true,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  pagination: Pagination;
}

/** Normalises backend + network failures into a single readable message. */
export function apiErrorMessage(error: unknown): string {
  const err = error as AxiosError<{ message?: string }>;
  if (err?.response?.data?.message) return err.response.data.message;
  if (err?.code === "ECONNABORTED") return "The request timed out. Please try again.";
  if (err?.message === "Network Error") return "Unable to reach the server. Check your connection.";
  return "Something went wrong. Please try again.";
}

export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  return res.data.data;
}

export async function unwrapList<T>(
  promise: Promise<{ data: ApiEnvelope<T[]> }>,
): Promise<Paginated<T>> {
  const res = await promise;
  return {
    items: res.data.data ?? [],
    pagination: res.data.pagination ?? {
      page: 1,
      limit: res.data.data?.length ?? 0,
      total: res.data.data?.length ?? 0,
      totalPages: 1,
    },
  };
}

/** Redirects to login when the session is no longer valid. */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const requestUrl = error.config?.url ?? "";
    const isSessionProbe = requestUrl.endsWith("/auth/me");

    if (
      error.response?.status === 401 &&
      !isSessionProbe &&
      typeof window !== "undefined"
    ) {
      setToken(null);
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  },
);
