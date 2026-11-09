export type NavSection =
  | "dashboard"
  | "alerts"
  | "investigations"
  | "analytics"
  | "stores"
  | "skus"
  | "employees"
  | "settings"
  | "help";

export interface DashboardSummary {
  total_stores: number;
  total_skus: number;
  total_movements: number;
  total_cycle_counts: number;
  shortage_counts: number;
  shortage_units: number;
  total_alerts: number;
  active_investigations: number;
}

export interface RecentAlert {
  alert_id: string;
  store_id: string;
  store_name: string;
  sku_id: string;
  product_name: string;
  rule_code: string;
  reason: string;
  risk_score: number;
  status: string;
  created_at: string;
}

export interface RiskDistribution {
  risk_level: string;
  total: number;
}

export interface InvestigationStatus {
  status: string;
  total: number;
}

export interface AlertTrend {
  alert_date: string;
  total: number;
}

export interface Investigation {
  investigation_id: string;
  alert_id: string;
  assigned_to: string | null;
  status: "OPEN" | "ASSIGNED" | "INVESTIGATING" | "RESOLVED" | "ESCALATED" | string;
  outcome: string | null;
  opened_at: string;
  closed_at: string | null;
  store_id: string;
  sku_id: string;
  rule_code: string;
  reason: string;
  risk_score: number;
}

export interface InvestigationHistory {
  history_id: number;
  previous_status: string | null;
  new_status: string;
  notes: string | null;
  changed_by: string | null;
  changed_at: string;
}

export interface InvestigationDetailsResponse {
  investigation: Investigation;
  history: InvestigationHistory[];
}

export interface CreateInvestigationRequest {
  alert_id: string;
  assigned_to?: string;
  changed_by?: string;
}

export interface UpdateInvestigationStatusRequest {
  status: string;
  outcome?: string;
  notes?: string;
  changed_by?: string;
}

export interface AddInvestigationNoteRequest {
  notes: string;
  changed_by?: string;
}

export interface AssignInvestigationRequest {
  assigned_to: string;
  changed_by?: string;
}

export interface ShrinkageDetectionResult {
  message: string;
  shortage_counts_found: number;
  alerts_created: number;
  evidence_records_created: number;
  existing_alerts_skipped: number;
}

export interface RepeatedAdjustmentResult {
  message: string;
  adjustment_groups_found: number;
  alerts_created: number;
  evidence_records_created: number;
  existing_alerts_skipped: number;
}

export interface TransferInconsistencyResult {
  message: string;
  inconsistent_transfers_found: number;
  alerts_created: number;
  evidence_records_created: number;
  existing_alerts_skipped: number;
}

export interface AnomalyValidationScenario {
  scenario_id?: string;
  rule_tested?: string;
  result?: string;
  expected?: string;
  actual?: string;
  details?: string;
  [key: string]: unknown;
}

export interface AnomalyValidationResult {
  message: string;
  total_scenarios: number;
  passed: number;
  failed: number;
  accuracy: number;
  precision: number;
  recall: number;
  f1_score: number;
  results: AnomalyValidationScenario[];
}

export interface HealthCheckResponse {
  status: string;
  database: string;
  database_status: string;
}

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
}

// Derived Models for frontend navigation
export interface DerivedStore {
  store_id: string;
  store_name?: string;
  status: string;
  alert_count: number;
  investigation_count: number;
  highest_risk: number;
  recent_alert_date?: string;
}

export interface DerivedSKU {
  sku_id: string;
  product_name: string;
  category?: string;
  alert_count: number;
  investigation_count: number;
  highest_risk: number;
  latest_reason?: string;
}

export interface DerivedEmployee {
  employee_id: string;
  name: string;
  role: string;
  store_id: string;
  status: string;
  assigned_cases_count: number;
  active_cases_count: number;
  resolved_cases_count: number;
  audit_actions_count: number;
  last_action?: string;
  last_action_date?: string;
}

// User Settings & Preferences
export interface UserProfileSettings {
  name: string;
  designation: string;
  department: string;
  operatorId: string;
  defaultLanding: NavSection;
  inactivityLock: "disabled" | "15min" | "30min" | "60min";
}

export interface NotificationSettings {
  newAlerts: boolean;
  highRiskAlerts: boolean;
  investigationAssignments: boolean;
  statusUpdates: boolean;
  soundAlerts: boolean;
}

export interface AlertRuleSettings {
  highRiskThreshold: number;
  mediumRiskThreshold: number;
  defaultSortOrder: "newest" | "highest_risk" | "store_id" | "shortage";
  defaultRiskFilter: "ALL" | "HIGH" | "MEDIUM_HIGH";
  autoOpenAlerts: boolean;
  autoFlagHighPriority: boolean;
  defaultInvestigationStatus: "ACTIVE" | "ALL" | "OPEN";
  requireResolutionNotes: boolean;
}

export interface DisplayLayoutSettings {
  dateTimeFormat: "iso" | "us" | "international";
  tableDensity: "comfortable" | "compact";
  chartVisual: "spline" | "linear" | "bar";
  recentAlertsLimit: number;
  autoRefresh: boolean;
  refreshIntervalSeconds: number;
}


