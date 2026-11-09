import { useState, useEffect, useCallback, useMemo } from "react";
import type {
  NavSection,
  DashboardSummary,
  RecentAlert,
  RiskDistribution,
  InvestigationStatus,
  AlertTrend,
  Investigation,
  InvestigationHistory,
  ToastMessage,
  DerivedStore,
  DerivedSKU,
  UserProfileSettings,
} from "./types";
import { preferencesStorage } from "./services/preferencesStorage";
import { DATABASE_EMPLOYEES } from "./data/databaseEmployees";
import { dashboardApi } from "./services/dashboardApi";
import { investigationApi } from "./services/investigationApi";
import { Sidebar } from "./components/Sidebar";
import { Header } from "./components/Header";
import { NotificationDrawer } from "./components/NotificationDrawer";
import { AlertDetailsModal } from "./components/AlertDetailsModal";
import { InvestigationDetailsModal } from "./components/InvestigationDetailsModal";
import { Toast } from "./components/Toast";

// Pages
import { DashboardPage } from "./pages/DashboardPage";
import { AlertsPage } from "./pages/AlertsPage";
import { InvestigationsPage } from "./pages/InvestigationsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { StoresPage } from "./pages/StoresPage";
import { SKUsPage } from "./pages/SKUsPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { SettingsPage } from "./pages/SettingsPage";
import { HelpPage } from "./pages/HelpPage";

import "./App.css";

export function App() {
  const [currentSection, setCurrentSection] = useState<NavSection>("dashboard");

  // Core backend data states
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [alerts, setAlerts] = useState<RecentAlert[]>([]);
  const [risks, setRisks] = useState<RiskDistribution[]>([]);
  const [statuses, setStatuses] = useState<InvestigationStatus[]>([]);
  const [trend, setTrend] = useState<AlertTrend[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [investigationHistories, setInvestigationHistories] = useState<InvestigationHistory[]>([]);

  // Loading & error states
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");

  // Modals & drawers
  const [selectedAlert, setSelectedAlert] = useState<RecentAlert | null>(null);
  const [selectedInvestigationId, setSelectedInvestigationId] = useState<string | null>(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isCreatingInvestigation, setIsCreatingInvestigation] = useState<boolean>(false);

  // Toast notification state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // User Profile & Display Preferences from localStorage
  const [userProfile, setUserProfile] = useState<UserProfileSettings>(() => {
    return preferencesStorage.getUserProfile();
  });
  const [displayDensity, setDisplayDensity] = useState<"comfortable" | "compact">(() => {
    return preferencesStorage.getDisplaySettings().tableDensity;
  });

  const showToast = useCallback(
    (type: "success" | "error" | "info" | "warning", title: string, message: string) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      // Auto dismiss after 4 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Fetch all live database data from backend
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [
        summaryRes,
        alertsRes,
        risksRes,
        statusesRes,
        trendRes,
        investigationsRes,
      ] = await Promise.all([
        dashboardApi.getSummary(),
        dashboardApi.getRecentAlerts(),
        dashboardApi.getRiskDistribution(),
        dashboardApi.getInvestigationStatus(),
        dashboardApi.getAlertTrend(),
        investigationApi.getAll(),
      ]);

      setSummary(summaryRes.data);
      setAlerts(alertsRes.data || []);
      setRisks(risksRes.data || []);
      setStatuses(statusesRes.data || []);
      setTrend(trendRes.data || []);
      setInvestigations(investigationsRes || []);

      // Retrieve full audit histories across investigations for employee metrics
      if (investigationsRes && investigationsRes.length > 0) {
        const detailResponses = await Promise.all(
          investigationsRes.map((inv) =>
            investigationApi.getById(inv.investigation_id).catch(() => null)
          )
        );
        const allHistories = detailResponses
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .flatMap((item) => item.history || []);
        setInvestigationHistories(allHistories);
      } else {
        setInvestigationHistories([]);
      }
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Unable to communicate with the FastAPI backend.";
      setError(msg);
      showToast("error", "Database Sync Failed", msg);
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData();
  }, [loadData]);

  // Derive unique stores for search and stores page from real database alerts and investigations
  const derivedStores: DerivedStore[] = useMemo(() => {
    const storeMap = new Map<string, DerivedStore>();

    alerts.forEach((alert) => {
      const existing = storeMap.get(alert.store_id) || {
        store_id: alert.store_id,
        store_name: alert.store_name || undefined,
        status: "ACTIVE",
        alert_count: 0,
        investigation_count: 0,
        highest_risk: 0,
        recent_alert_date: alert.created_at,
      };
      existing.alert_count++;
      if (alert.store_name && !existing.store_name) {
        existing.store_name = alert.store_name;
      }
      if (alert.risk_score > existing.highest_risk) {
        existing.highest_risk = alert.risk_score;
      }
      storeMap.set(alert.store_id, existing);
    });

    investigations.forEach((inv) => {
      const existing = storeMap.get(inv.store_id) || {
        store_id: inv.store_id,
        status: "ACTIVE",
        alert_count: 0,
        investigation_count: 0,
        highest_risk: 0,
      };
      existing.investigation_count++;
      if (inv.risk_score > existing.highest_risk) {
        existing.highest_risk = inv.risk_score;
      }
      storeMap.set(inv.store_id, existing);
    });

    return Array.from(storeMap.values()).sort((a, b) => b.alert_count - a.alert_count);
  }, [alerts, investigations]);

  // Derive unique SKUs for search and SKUs page
  const derivedSkus: DerivedSKU[] = useMemo(() => {
    const skuMap = new Map<string, DerivedSKU>();

    alerts.forEach((alert) => {
      const existing = skuMap.get(alert.sku_id) || {
        sku_id: alert.sku_id,
        product_name: alert.product_name || `Product ${alert.sku_id}`,
        category: "Retail Inventory",
        alert_count: 0,
        investigation_count: 0,
        highest_risk: 0,
        latest_reason: alert.reason,
      };
      existing.alert_count++;
      if (alert.risk_score > existing.highest_risk) {
        existing.highest_risk = alert.risk_score;
      }
      skuMap.set(alert.sku_id, existing);
    });

    investigations.forEach((inv) => {
      const existing = skuMap.get(inv.sku_id) || {
        sku_id: inv.sku_id,
        product_name: `Product ${inv.sku_id}`,
        category: "Retail Inventory",
        alert_count: 0,
        investigation_count: 0,
        highest_risk: 0,
        latest_reason: inv.reason,
      };
      existing.investigation_count++;
      if (inv.risk_score > existing.highest_risk) {
        existing.highest_risk = inv.risk_score;
      }
      skuMap.set(inv.sku_id, existing);
    });

    return Array.from(skuMap.values());
  }, [alerts, investigations]);

  // Known valid database employee IDs for auto-suggestions
  const knownEmployees = useMemo(() => {
    return DATABASE_EMPLOYEES.map((e) => e.employee_id);
  }, []);

  // Handler: Create investigation from alert
  const handleCreateInvestigationFromAlert = async (alertId: string, assignedTo?: string) => {
    try {
      setIsCreatingInvestigation(true);
      const res = await investigationApi.create({
        alert_id: alertId,
        assigned_to: assignedTo,
        changed_by: "EMP-000001",
      });

      showToast(
        "success",
        "Investigation Launched",
        `Created case ${res.investigation_id} in MySQL database.`
      );

      // Refresh data
      await loadData();

      // Open the newly created investigation modal
      setSelectedAlert(null);
      setSelectedInvestigationId(res.investigation_id);
    } catch (err) {
      showToast(
        "error",
        "Could Not Create Case",
        err instanceof Error ? err.message : "Investigation creation failed."
      );
    } finally {
      setIsCreatingInvestigation(false);
    }
  };

  const handleSelectInvestigation = (inv: Investigation) => {
    setSelectedInvestigationId(inv.investigation_id);
  };

  const handleSelectAlert = (alert: RecentAlert) => {
    setSelectedAlert(alert);
  };

  const unreadAlertsCount = alerts.filter((a) => a.risk_score >= 70).length;

  return (
    <div className={`app-layout ${displayDensity === "compact" ? "density-compact" : ""}`}>
      {/* Sidebar Navigation */}
      <Sidebar
        currentSection={currentSection}
        onNavigate={setCurrentSection}
        totalAlerts={summary?.total_alerts}
      />

      {/* Main Content Area */}
      <main className="main-content">
        {/* Dynamic Header with Search & Notifications */}
        <Header
          currentSection={currentSection}
          alerts={alerts}
          investigations={investigations}
          stores={derivedStores}
          skus={derivedSkus}
          unreadAlertsCount={unreadAlertsCount}
          onOpenNotifications={() => setIsNotificationOpen(true)}
          onSelectAlert={handleSelectAlert}
          onSelectInvestigation={handleSelectInvestigation}
          onNavigate={setCurrentSection}
          userProfile={userProfile}
        />

        {/* Active Page View */}
        {currentSection === "dashboard" && (
          <DashboardPage
            summary={summary}
            alerts={alerts}
            risks={risks}
            statuses={statuses}
            trend={trend}
            loading={loading}
            error={error}
            onRetry={loadData}
            onSelectAlert={handleSelectAlert}
            selectedAlertId={selectedAlert?.alert_id}
          />
        )}

        {currentSection === "alerts" && (
          <AlertsPage
            alerts={alerts}
            investigations={investigations}
            loading={loading}
            onRefresh={loadData}
            onSelectAlert={handleSelectAlert}
            onShowToast={showToast}
          />
        )}

        {currentSection === "investigations" && (
          <InvestigationsPage
            investigations={investigations}
            alerts={alerts}
            loading={loading}
            onRefresh={loadData}
            onSelectInvestigation={handleSelectInvestigation}
            onShowToast={showToast}
          />
        )}

        {currentSection === "analytics" && (
          <AnalyticsPage
            summary={summary}
            risks={risks}
            statuses={statuses}
            trend={trend}
            investigations={investigations}
            alerts={alerts}
            loading={loading}
            onRefresh={loadData}
            onShowToast={showToast}
          />
        )}

        {currentSection === "stores" && (
          <StoresPage
            totalStoresCount={summary?.total_stores}
            alerts={alerts}
            investigations={investigations}
            loading={loading}
            onRefresh={loadData}
            onSelectAlert={handleSelectAlert}
            onSelectInvestigation={handleSelectInvestigation}
          />
        )}

        {currentSection === "skus" && (
          <SKUsPage
            totalSkusCount={summary?.total_skus}
            totalShortageUnits={summary?.shortage_units}
            alerts={alerts}
            investigations={investigations}
            loading={loading}
            onRefresh={loadData}
            onSelectAlert={handleSelectAlert}
            onSelectInvestigation={handleSelectInvestigation}
          />
        )}

        {currentSection === "employees" && (
          <EmployeesPage
            investigations={investigations}
            investigationHistories={investigationHistories}
            loading={loading}
            onRefresh={loadData}
            onSelectInvestigation={handleSelectInvestigation}
          />
        )}

        {currentSection === "settings" && (
          <SettingsPage
            onShowToast={showToast}
            onNavigate={setCurrentSection}
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            displayDensity={displayDensity}
            onUpdateDensity={setDisplayDensity}
          />
        )}

        {currentSection === "help" && <HelpPage />}
      </main>

      {/* Slide-over Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationOpen}
        alerts={alerts}
        onClose={() => setIsNotificationOpen(false)}
        onSelectAlert={handleSelectAlert}
        onViewAllAlerts={() => setCurrentSection("alerts")}
      />

      {/* Alert Details Modal */}
      <AlertDetailsModal
        alert={selectedAlert}
        investigations={investigations}
        isCreatingInvestigation={isCreatingInvestigation}
        onClose={() => setSelectedAlert(null)}
        onCreateInvestigation={handleCreateInvestigationFromAlert}
        onViewInvestigation={handleSelectInvestigation}
      />

      {/* Investigation Details Modal */}
      <InvestigationDetailsModal
        investigationId={selectedInvestigationId}
        onClose={() => setSelectedInvestigationId(null)}
        onRefreshData={loadData}
        onShowToast={showToast}
        knownEmployees={knownEmployees}
      />

      {/* Toast Notification Container */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
