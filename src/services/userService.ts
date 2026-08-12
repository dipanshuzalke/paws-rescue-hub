import { api, unwrap } from "@/lib/api-client";
import { adaptUser } from "@/lib/api-adapters";
import type { ApiUser } from "@/lib/api-adapters";
import type { User } from "@/types";

export const userService = {
  async getProfile(): Promise<User> {
    const data = await unwrap<{ user: ApiUser }>(api.get("/auth/me"));
    return adaptUser(data.user);
  },

  async updateProfile(patch: Partial<Pick<User, "name" | "phone" | "location">>): Promise<User> {
    const data = await unwrap<{ user: ApiUser }>(api.put("/auth/me", patch));
    return adaptUser(data.user);
  },
};
