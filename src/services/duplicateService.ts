import { api, unwrap } from "@/lib/api-client";
import {
  adaptDuplicateResult,
  adaptReport,
  toApiAnimal,
  toApiCondition,
} from "@/lib/api-adapters";
import type { ApiDuplicateResult, ApiReport } from "@/lib/api-adapters";
import type {
  AnimalType,
  Condition,
  DuplicateCheckResult,
  RescueReport,
} from "@/types";

export interface DuplicateCheckInput {
  animal: AnimalType;
  coords: { lat: number; lng: number };
  condition?: Condition;
  radiusMeters?: number;
  windowHours?: number;
}

const EMPTY: DuplicateCheckResult = {
  hasDuplicates: false,
  radiusMeters: 0,
  windowHours: 0,
  matches: [],
};

export const duplicateService = {
  /**
   * Pre-submission check used by the citizen report wizard.
   * Never blocks the report — a failure resolves to "no duplicates found".
   */
  async check(input: DuplicateCheckInput): Promise<DuplicateCheckResult> {
    try {
      const data = await unwrap<ApiDuplicateResult>(
        api.post("/reports/check-duplicates", {
          animalType: toApiAnimal(input.animal),
          latitude: input.coords.lat,
          longitude: input.coords.lng,
          ...(input.condition ? { condition: toApiCondition(input.condition) } : {}),
          ...(input.radiusMeters ? { radiusMeters: input.radiusMeters } : {}),
          ...(input.windowHours ? { windowHours: input.windowHours } : {}),
        }),
      );
      return adaptDuplicateResult(data);
    } catch {
      return EMPTY;
    }
  },

  /** Operational duplicate candidates for an existing case (NGO / Admin). */
  async forReport(reportId: string): Promise<DuplicateCheckResult> {
    const data = await unwrap<ApiDuplicateResult>(api.get(`/reports/${reportId}/duplicates`));
    return adaptDuplicateResult(data);
  },

  /** Links this report to the primary case. Never deletes anything. */
  async markDuplicate(
    reportId: string,
    primaryReportId: string,
    note?: string,
  ): Promise<RescueReport> {
    return adaptReport(
      await unwrap<ApiReport>(
        api.post(`/reports/${reportId}/mark-duplicate`, { primaryReportId, note: note ?? "" }),
      ),
    );
  },

  /** Dismisses the duplicate suggestion and keeps the case separate. */
  async keepSeparate(reportId: string, note?: string): Promise<RescueReport> {
    return adaptReport(
      await unwrap<ApiReport>(api.post(`/reports/${reportId}/keep-separate`, { note: note ?? "" })),
    );
  },
};
