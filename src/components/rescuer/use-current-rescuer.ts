import { useMemo } from "react";

import { mockRescuers } from "@/data/mockUsers";
import { useAsync } from "@/hooks/use-async";
import { rescueService } from "@/services/rescueService";
import { useApp } from "@/store/app-store";
import type { Rescuer } from "@/types";

/** Resolves the logged-in rescuer's extended profile. */
export function useCurrentRescuer(): Rescuer {
  const { user, apiMode } = useApp();

  const { data: stats } = useAsync(
    () =>
      apiMode
        ? rescueService.getRescuerStats()
        : Promise.resolve(null),
    [apiMode, user?.id],
  );

  return useMemo(() => {
    if (!apiMode) {
      return mockRescuers.find((r) => r.id === user?.id) ?? mockRescuers[0]!;
    }

    return {
      ...(user as Rescuer),
      role: "rescuer",
      availability: user?.availability ?? "Offline",
      distanceKm: 0,
      activeCases: stats?.activeRescues ?? 0,
      completedCases: stats?.completedRescues ?? 0,
      avgResponseMins: stats?.avgResponseMins ?? 0,
      rating: 0,
      ngoId: user?.organization ?? "",
      coords: { lat: 21.1458, lng: 79.0882 },
      isOnline: user?.isOnline ?? false,
    };
  }, [apiMode, stats, user]);
}

export function elapsedLabel(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
