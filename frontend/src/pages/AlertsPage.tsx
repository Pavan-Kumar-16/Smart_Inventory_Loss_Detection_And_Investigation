import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  Play,
  RotateCw,
  ShieldAlert,
  Zap,
} from "lucide-react";
import type { RecentAlert, Investigation } from "../types";
import { detectionApi } from "../services/detectionApi";

interface AlertsPageProps {
  alerts: RecentAlert[];
  investigations: Investigation[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectAlert: (alert: RecentAlert) => void;
  onShowToast: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string
  ) => void;
}

export const AlertsPage: React.FC<AlertsPageProps> = ({
  alerts,
  investigations,
  loading,
  onRefresh,
  onSelectAlert,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"risk" | "date" | "id">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Detection running states
  const [isRunningShrinkage, setIsRunningShrinkage] = useState(false);
  const [isRunningRepeated, setIsRunningRepeated] = useState(false);
  const [isRunningTransfer, setIsRunningTransfer] = useState(false);

  // Extract unique stores for dropdown
  const storeOptions = useMemo(() => {
    const map = new Map<string, string>();
    alerts.forEach((a) => {
      map.set(a.store_id, a.store_name || a.store_id);
    });
    return Array.from(map.entries());
  }, [alerts]);

  // Filter and sort alerts
  const filteredAlerts = useMemo(() => {
    return alerts
      .filter((alert) => {
        // Search
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            alert.alert_id.toLowerCase().includes(q) ||
            alert.store_name.toLowerCase().includes(q) ||
            alert.store_id.toLowerCase().includes(q) ||
            alert.product_name.toLowerCase().includes(q) ||
            alert.sku_id.toLowerCase().includes(q) ||
            alert.reason.toLowerCase().includes(q) ||
            alert.rule_code.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Risk filter
        if (riskFilter !== "ALL") {
          const riskCat =
            alert.risk_score >= 70
              ? "HIGH"
              : alert.risk_score >= 40
              ? "MEDIUM"
              : "LOW";
          if (riskCat !== riskFilter) return false;
        }

        // Status filter
        if (statusFilter !== "ALL" && alert.status !== statusFilter) {
          return false;
        }

        // Store filter
        if (storeFilter !== "ALL" && alert.store_id !== storeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff: number;
        if (sortBy === "risk") {
          diff = a.risk_score - b.risk_score;
        } else if (sortBy === "id") {
          diff = a.alert_id.localeCompare(b.alert_id);
        } else {
          // date
          diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [alerts, searchQuery, riskFilter, statusFilter, storeFilter, sortBy, sortOrder]);

  const handleRunShrinkage = async () => {
    try {
      setIsRunningShrinkage(true);
      const res = await detectionApi.runShrinkageDetection();
      onShowToast(
        "success",
        "Shrinkage Detection Complete",
        `Shortages scanned: ${res.shortage_counts_found}. New alerts: ${res.alerts_created}. Evidence generated: ${res.evidence_records_created}.`
      );
      await onRefresh();
    } catch (err) {
      onShowToast(
        "error",
        "Detection Failed",
        err instanceof Error ? err.message : "Shrinkage detection could not run."
      );
    } finally {
      setIsRunningShrinkage(false);
    }
  };

  const handleRunRepeatedAdjustments = async () => {
    try {
      setIsRunningRepeated(true);
      const res = await detectionApi.runRepeatedAdjustments();
      onShowToast(
        "success",
        "Adjustment Detection Complete",
        `Suspicious adjustment groups found: ${res.adjustment_groups_found}. Alerts created: ${res.alerts_created}.`
      );
      await onRefresh();
    } catch (err) {
      onShowToast(
        "error",
        "Detection Failed",
        err instanceof Error ? err.message : "Repeated adjustment detection failed."
      );
    } finally {
      setIsRunningRepeated(false);
    }
  };

  const handleRunTransferInconsistencies = async () => {
    try {
      setIsRunningTransfer(true);
      const res = await detectionApi.runTransferInconsistencies();
      onShowToast(
        "success",
        "Transfer Detection Complete",
        `Discrepant transfers found: ${res.inconsistent_transfers_found}. Alerts created: ${res.alerts_created}.`
      );
      await onRefresh();
    } catch (err) {
      onShowToast(
        "error",
        "Detection Failed",
        err instanceof Error ? err.message : "Transfer detection failed."
      );
    } finally {
      setIsRunningTransfer(false);
    }
  };

  return (
    <section className="dashboard-content">
      {/* Top Banner / Engine Triggers */}
      <div className="alerts-header-actions">
        <div className="engine-triggers-group">
          <div className="engine-triggers-title">
            <Zap size={18} color="#6541d8" />
            <span>Automated Loss Detection Engines:</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRunShrinkage}
            disabled={isRunningShrinkage}
          >
            <Play size={14} />
            {isRunningShrinkage ? "Scanning..." : "Run Shrinkage Rule"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRunRepeatedAdjustments}
            disabled={isRunningRepeated}
          >
            <Play size={14} />
            {isRunningRepeated ? "Scanning..." : "Run Repeated Adjustments"}
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRunTransferInconsistencies}
            disabled={isRunningTransfer}
          >
            <Play size={14} />
            {isRunningTransfer ? "Scanning..." : "Run Transfer Rule"}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
          title="Refresh alerts from database"
        >
          <RotateCw size={15} /> Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel filter-bar-panel">
        <div className="filter-controls-row">
          <div className="filter-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Alert ID, Store, SKU, or Reason..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects-group">
            <label className="filter-label">
              <Filter size={15} /> Risk:
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
              >
                <option value="ALL">All Risks</option>
                <option value="HIGH">High (&gt;=70)</option>
                <option value="MEDIUM">Medium (40-69)</option>
                <option value="LOW">Low (&lt;40)</option>
              </select>
            </label>

            <label className="filter-label">
              Status:
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">OPEN</option>
                <option value="ASSIGNED">ASSIGNED</option>
                <option value="INVESTIGATING">INVESTIGATING</option>
                <option value="RESOLVED">RESOLVED</option>
                <option value="ESCALATED">ESCALATED</option>
              </select>
            </label>

            {storeOptions.length > 0 && (
              <label className="filter-label">
                Store:
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                >
                  <option value="ALL">All Stores</option>
                  {storeOptions.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name} ({id})
                    </option>
                  ))}
                </select>
              </label>
            )}

            <label className="filter-label">
              <ArrowUpDown size={15} /> Sort:
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split("-") as [
                    "risk" | "date" | "id",
                    "asc" | "desc"
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="risk-desc">Highest Risk First</option>
                <option value="risk-asc">Lowest Risk First</option>
                <option value="id-asc">Alert ID (A-Z)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="panel alerts-panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <h2>Inventory Loss Alerts</h2>
            <span className="results-count-badge">
              Showing {filteredAlerts.length} of {alerts.length} records
            </span>
          </div>
          <span className="panel-subtitle">Click row to inspect or create investigation</span>
        </div>

        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Alert ID</th>
                <th>Store Facility</th>
                <th>SKU & Product</th>
                <th>Detection Rule</th>
                <th>Risk Score</th>
                <th>Status</th>
                <th>Investigation Case</th>
                <th>Detected Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredAlerts.map((alert) => {
                const riskCat =
                  alert.risk_score >= 70
                    ? "high"
                    : alert.risk_score >= 40
                    ? "medium"
                    : "low";

                const existingInv = investigations.find(
                  (inv) => inv.alert_id === alert.alert_id
                );

                return (
                  <tr
                    key={alert.alert_id}
                    onClick={() => onSelectAlert(alert)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{alert.alert_id}</strong>
                    </td>
                    <td>
                      <div>{alert.store_name}</div>
                      <small className="cell-sub">{alert.store_id}</small>
                    </td>
                    <td>
                      <div>{alert.product_name}</div>
                      <small className="cell-sub">{alert.sku_id}</small>
                    </td>
                    <td>
                      <code className="rule-code-badge">{alert.rule_code}</code>
                    </td>
                    <td>
                      <span className={`risk-badge ${riskCat}`}>
                        {alert.risk_score}
                      </span>
                    </td>
                    <td>
                      <span className={`status-pill status-${(alert.status || "").toLowerCase()}`}>
                        {alert.status}
                      </span>
                    </td>
                    <td>
                      {existingInv ? (
                        <span className="case-link-pill">
                          {existingInv.investigation_id}
                        </span>
                      ) : (
                        <span className="unassigned-text">None</span>
                      )}
                    </td>
                    <td>{new Date(alert.created_at).toLocaleString()}</td>
                  </tr>
                );
              })}

              {filteredAlerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="empty-state">
                    <ShieldAlert size={30} color="#929bb2" style={{ margin: "10px auto" }} />
                    <p>No shrinkage alerts match your current search and filters.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};
