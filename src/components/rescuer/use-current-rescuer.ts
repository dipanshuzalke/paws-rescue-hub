import { useMemo } from "react";

import { mockRescuers } from "@/data/mockUsers";
import { useApp } from "@/store/app-store";
import type { Rescuer } from "@/types";

/** Resolves the logged-in rescuer's extended profile from mock data. */
export function useCurrentRescuer(): Rescuer {
  const { user } = useApp();
  return useMemo(
    () => mockRescuers.find((r) => r.id === user?.id) ?? mockRescuers[0]!,
    [user],
  );
}

export function elapsedLabel(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
