import { api, unwrap, unwrapList } from "@/lib/api-client";
import type { Paginated } from "@/lib/api-client";
import { adaptReport } from "@/lib/api-adapters";
import type { ApiReport } from "@/lib/api-adapters";
import type { RescueReport } from "@/types";
import type { ReportQuery } from "./reportService";

export interface EvidenceSubmitInput {
  files: File[];
  notes: string;
  animalCondition?: string;
  treatmentNotes?: string;
  coords?: { lat: number; lng: number } | null;
}

export const evidenceService = {
  /** Assigned rescuer submits (or resubmits) rescue evidence for verification. */
  async submit(reportId: string, input: EvidenceSubmitInput): Promise<RescueReport> {
    const form = new FormData();
    input.files.forEach((file) => form.append("photos", file));
    form.append("notes", input.notes);
    form.append("animalCondition", input.animalCondition ?? "");
    form.append("treatmentNotes", input.treatmentNotes ?? "");
    if (input.coords) {
      form.append("latitude", String(input.coords.lat));
      form.append("longitude", String(input.coords.lng));
    }
    form.append("confirmed", "true");

    return adaptReport(await unwrap<ApiReport>(api.post(`/rescues/${reportId}/evidence`, form)));
  },

  /** NGO / Admin verification queue. */
  async getPending(query?: ReportQuery): Promise<Paginated<RescueReport>> {
    const { items, pagination } = await unwrapList<ApiReport>(
      api.get("/rescues/pending-verification", { params: query }),
    );
    return { items: items.map(adaptReport), pagination };
  },

  async getEvidence(reportId: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.get(`/rescues/${reportId}/evidence`)));
  },

  /** Approves the evidence; by default this also closes the case. */
  async verify(reportId: string, notes?: string, close = true): Promise<RescueReport> {
    return adaptReport(
      await unwrap<ApiReport>(
        api.post(`/rescues/${reportId}/evidence/verify`, { notes: notes ?? "", close }),
      ),
    );
  },

  /** Rejects the evidence; the rescuer must revise and resubmit. */
  async reject(reportId: string, reason: string): Promise<RescueReport> {
    return adaptReport(
      await unwrap<ApiReport>(api.post(`/rescues/${reportId}/evidence/reject`, { reason })),
    );
  },
};
