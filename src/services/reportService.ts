import { api, unwrap, unwrapList } from "@/lib/api-client";
import type { Paginated } from "@/lib/api-client";
import { adaptReport, toApiAnimal, toApiCondition } from "@/lib/api-adapters";
import type { ApiReport } from "@/lib/api-adapters";
import type { AnimalType, Condition, Emergency, RescueReport, RescueStatus } from "@/types";

export interface ReportQuery {
  search?: string;
  animalType?: AnimalType;
  condition?: Condition;
  emergencyLevel?: Emergency;
  status?: RescueStatus;
  city?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CitizenStats {
  totalReports: number;
  pendingReports: number;
  activeRescues: number;
  rescuedCases: number;
}

function toParams(query: ReportQuery = {}) {
  return {
    ...query,
    animalType: query.animalType ? toApiAnimal(query.animalType) : undefined,
    condition: query.condition ? toApiCondition(query.condition) : undefined,
  };
}

async function adaptedList(url: string, query?: ReportQuery): Promise<Paginated<RescueReport>> {
  const { items, pagination } = await unwrapList<ApiReport>(
    api.get(url, { params: toParams(query) }),
  );
  return { items: items.map(adaptReport), pagination };
}

export interface CreateReportInput {
  animal: AnimalType;
  count: number;
  condition: Condition;
  emergency: Emergency;
  description: string;
  contactPhone: string,
  address: string;
  area: string;
  city?: string;
  coords: { lat: number; lng: number };
  files?: File[];
  /** Phase 3 — records that the citizen saw and dismissed a duplicate warning. */
  duplicateWarningShown?: boolean;
  duplicateOverride?: boolean;
}

export const reportService = {
  getReports: (query?: ReportQuery) => adaptedList("/reports", query),
  getMyReports: (query?: ReportQuery) => adaptedList("/reports/my-reports", query),
  getByStatus: (status: RescueStatus, query?: ReportQuery) =>
    adaptedList(`/reports/status/${status}`, query),

  async getMyStats(): Promise<CitizenStats> {
    return unwrap<CitizenStats>(api.get("/reports/my-stats"));
  },

  async getReportById(id: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.get(`/reports/${id}`)));
  },

  /** Sends the report as multipart form data so Multer/Cloudinary receive the images. */
async createReport(input: CreateReportInput): Promise<RescueReport> {
    const form = new FormData();
    form.append("animalType", toApiAnimal(input.animal));
    form.append("animalCount", String(input.count));
    form.append("condition", toApiCondition(input.condition));
    form.append("emergencyLevel", input.emergency);
    const safeDescription = input.description.trim() || `Need rescue assistance for ${input.animal.toLowerCase()} at ${input.area || input.address}`;
    form.append("description", safeDescription);
    form.append("contactPhone", input.contactPhone)
    form.append("address", input.address);
    form.append("area", input.area);
    form.append("city", input.city ?? "Nagpur");
    form.append("latitude", String(input.coords.lat));
    form.append("longitude", String(input.coords.lng));
    if (input.duplicateWarningShown) form.append("duplicateWarningShown", "true");
    if (input.duplicateOverride) form.append("duplicateOverride", "true");
    (input.files ?? []).forEach((file) => form.append("images", file));

    const data = await unwrap<ApiReport>(api.post("/reports", form));
    return adaptReport(data);
  },

  async updateReport(id: string, patch: Partial<CreateReportInput>): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.put(`/reports/${id}`, patch)));
  },

  async cancelReport(id: string, reason?: string): Promise<RescueReport> {
    return adaptReport(await unwrap<ApiReport>(api.post(`/reports/${id}/cancel`, { reason })));
  },

  async deleteReport(id: string): Promise<void> {
    await api.delete(`/reports/${id}`);
  },
};
