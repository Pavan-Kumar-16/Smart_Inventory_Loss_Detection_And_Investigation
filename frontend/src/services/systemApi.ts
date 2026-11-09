import { request } from "./apiClient";
import type { HealthCheckResponse } from "../types";

export const systemApi = {
  getHealth: () => request<HealthCheckResponse>("/health"),
  getHome: () => request<{ message: string }>("/"),
};

