import { request } from "./apiClient";
import type {
  DashboardSummary,
  RecentAlert,
  RiskDistribution,
  InvestigationStatus,
  AlertTrend,
} from "../types";

export const dashboardApi = {
  getSummary: () =>
    request<{ message?: string; data: DashboardSummary }>("/api/dashboard/summary"),

  getRecentAlerts: () =>
    request<{ data: RecentAlert[] }>("/api/dashboard/recent-alerts"),

  getRiskDistribution: () =>
    request<{ data: RiskDistribution[] }>("/api/dashboard/risk-distribution"),

  getInvestigationStatus: () =>
    request<{ data: InvestigationStatus[] }>("/api/dashboard/investigation-status"),

  getAlertTrend: () =>
    request<{ data: AlertTrend[] }>("/api/dashboard/alert-trend"),
};

export type {
  DashboardSummary,
  RecentAlert,
  RiskDistribution,
  InvestigationStatus,
  AlertTrend,
};
