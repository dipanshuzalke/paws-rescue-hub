import { useMemo } from "react";

import { mockRescuers } from "@/data/mockUsers";
import { useAsync } from "@/hooks/use-async";
import { ngoService } from "@/services/ngoService";
import { useApp } from "@/store/app-store";
import type { Rescuer } from "@/types";

/** Resolves the logged-in rescuer's extended profile. */
export function useCurrentRescuer(): Rescuer {
  const { user, apiMode } = useApp();

  const { data } = useAsync(
    () =>
      apiMode
        ? ngoService.getRescuers({ limit: 200 }).then((r) => r.items)
        : Promise.resolve(mockRescuers),
    [apiMode],
  );

  return useMemo(() => {
    const list = data ?? mockRescuers;
    return list.find((r) => r.id === user?.id) ?? list[0]!;
  }, [data, user]);
}

export function elapsedLabel(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}
