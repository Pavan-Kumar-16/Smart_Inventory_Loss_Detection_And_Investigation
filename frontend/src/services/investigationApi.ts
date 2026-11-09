import { request } from "./apiClient";
import type {
  Investigation,
  InvestigationDetailsResponse,
  CreateInvestigationRequest,
  UpdateInvestigationStatusRequest,
  AddInvestigationNoteRequest,
  AssignInvestigationRequest,
} from "../types";

export const investigationApi = {
  getAll: () => request<Investigation[]>("/api/investigations/"),

  getById: (investigationId: string) =>
    request<InvestigationDetailsResponse>(`/api/investigations/${encodeURIComponent(investigationId)}`),

  create: (data: CreateInvestigationRequest) =>
    request<{
      message: string;
      investigation_id: string;
      alert_id: string;
      status: string;
      assigned_to: string | null;
    }>("/api/investigations/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  updateStatus: (
    investigationId: string,
    data: UpdateInvestigationStatusRequest
  ) =>
    request<{
      message: string;
      investigation_id: string;
      previous_status: string;
      new_status: string;
      outcome?: string | null;
    }>(`/api/investigations/${encodeURIComponent(investigationId)}/status`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  addNote: (investigationId: string, data: AddInvestigationNoteRequest) =>
    request<{
      message: string;
      investigation_id: string;
      status: string;
    }>(`/api/investigations/${encodeURIComponent(investigationId)}/notes`, {
      method: "POST",
      body: JSON.stringify(data),
    }),

  assign: (investigationId: string, data: AssignInvestigationRequest) =>
    request<{
      message: string;
      investigation_id: string;
      assigned_to: string;
      previous_status: string;
      new_status: string;
    }>(`/api/investigations/${encodeURIComponent(investigationId)}/assign`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
};

