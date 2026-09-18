import { api, setToken, unwrap } from "@/lib/api-client";
import { adaptUser, toApiRole } from "@/lib/api-adapters";
import type { ApiUser } from "@/lib/api-adapters";
import type { Role, User } from "@/types";

interface AuthPayload {
  user: ApiUser;
  token: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
  vehicle?: string;
  bio?: string;
  organizationName?: string;
  organizationDescription?: string;
  location?: {
    address?: string;
    coordinates?: [number, number];
  };
}

export const authService = {
  async register(input: RegisterInput): Promise<User> {
    const data = await unwrap<AuthPayload>(
      api.post("/auth/register", { ...input, role: toApiRole(input.role) }),
    );
    setToken(data.token);
    return adaptUser(data.user);
  },

  async login(email: string, password: string): Promise<User> {
    const data = await unwrap<AuthPayload>(api.post("/auth/login", { email, password }));
    setToken(data.token);
    return adaptUser(data.user);
  },

  async forgotPassword(email: string): Promise<void> {
    await unwrap(api.post("/auth/forgot-password", { email }));
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await unwrap(api.post("/auth/reset-password", { token, password }));
  },

  async me(): Promise<User> {
    const data = await unwrap<{ user: ApiUser }>(api.get("/auth/me"));
    return adaptUser(data.user);
  },

  async updateProfile(patch: Partial<RegisterInput>): Promise<User> {
    const data = await unwrap<{ user: ApiUser }>(api.put("/auth/me", patch));

    return adaptUser(data.user);
  },

  async deleteAccount(): Promise<void> {
    try {
      await unwrap(api.delete("/auth/me"));
    } finally {
      setToken(null);
    }
  },

  async heartbeat(): Promise<void> {
    await api.post("/auth/heartbeat");
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      setToken(null);
    }
  },
};
