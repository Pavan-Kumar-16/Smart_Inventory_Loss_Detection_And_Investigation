import React from "react";
import {
  AlertTriangle,
  Search,
  Store,
  Package,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type {
  DashboardSummary,
  RecentAlert,
  RiskDistribution,
  InvestigationStatus,
  AlertTrend,
} from "../types";

interface DashboardPageProps {
  summary: DashboardSummary | null;
  alerts: RecentAlert[];
  risks: RiskDistribution[];
  statuses: InvestigationStatus[];
  trend: AlertTrend[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  onSelectAlert: (alert: RecentAlert) => void;
  selectedAlertId?: string;
}

const riskColors: Record<string, string> = {
  High: "#f04444",
  Medium: "#ffc43d",
  Low: "#36c995",
};

export const DashboardPage: React.FC<DashboardPageProps> = ({
  summary,
  alerts,
  risks,
  statuses,
  trend,
  loading,
  error,
  onRetry,
  onSelectAlert,
  selectedAlertId,
}) => {
  const totalRiskAlerts = risks.reduce((sum, item) => sum + item.total, 0);
  const totalInvestigations = statuses.reduce((sum, item) => sum + item.total, 0);

  if (loading) {
    return (
      <div className="dashboard-content">
        <p className="dashboard-message">Loading live database data from MySQL...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-content">
        <div className="dashboard-error">
          <strong>Dashboard data could not be loaded.</strong>
          <p>{error}</p>
          <button type="button" onClick={onRetry}>
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="dashboard-content">
        <p className="dashboard-message">No summary metrics returned from the database.</p>
      </div>
    );
  }

  return (
    <section className="dashboard-content">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card red-card">
          <div className="kpi-icon red-icon">
            <AlertTriangle size={30} />
          </div>
          <div className="kpi-details">
            <span>Total Alerts</span>
            <strong>{summary.total_alerts.toLocaleString()}</strong>
            <small>Active & resolved shrinkage</small>
          </div>
        </div>

        <div className="kpi-card purple-card">
          <div className="kpi-icon purple-icon">
            <Search size={30} />
          </div>
          <div className="kpi-details">
            <span>Active Investigations</span>
            <strong>{summary.active_investigations.toLocaleString()}</strong>
            <small>Under active triage</small>
          </div>
        </div>

        <div className="kpi-card blue-card">
          <div className="kpi-icon blue-icon">
            <Store size={30} />
          </div>
          <div className="kpi-details">
            <span>Stores Monitored</span>
            <strong>{summary.total_stores.toLocaleString()}</strong>
            <small>Facilities in network</small>
          </div>
        </div>

        <div className="kpi-card green-card">
          <div className="kpi-icon green-icon">
            <Package size={30} />
          </div>
          <div className="kpi-details">
            <span>SKUs Tracked</span>
            <strong>{summary.total_skus.toLocaleString()}</strong>
            <small>Catalog inventory items</small>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <section className="panel trend-panel">
          <div className="panel-header">
            <h2>Alert Trend</h2>
            <span>Last 7 Days (Live DB)</span>
          </div>
          <div className="trend-chart">
            {trend.length === 0 ? (
              <p className="empty-state">No alert trend data available in the current window.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trend}>
                  <defs>
                    <linearGradient id="alertGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7145f5" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#7145f5" stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#e8eaf2" vertical={false} />
                  <XAxis
                    dataKey="alert_date"
                    tickFormatter={(value) =>
                      new Date(value).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })
                    }
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                  <Tooltip
                    formatter={(value) => [`${value} alerts`, "Total Alerts"]}
                    labelFormatter={(value) =>
                      new Date(`${value}T00:00:00`).toLocaleDateString(undefined, {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    }
                    contentStyle={{
                      borderRadius: "10px",
                      border: "1px solid #e2e5f0",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    }}
                  />
                  <Area
                    dataKey="total"
                    name="Alerts"
                    stroke="#6938ef"
                    strokeWidth={2.5}
                    fill="url(#alertGradient)"
                    type="linear"
                    dot={{
                      r: 4,
                      fill: "#6938ef",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                    activeDot={{
                      r: 7,
                      fill: "#6938ef",
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>

        <section className="panel risk-panel">
          <div className="panel-header">
            <h2>Alerts by Risk Level</h2>
          </div>
          {totalRiskAlerts === 0 ? (
            <p className="empty-state">No risk distribution data available.</p>
          ) : (
            <div className="risk-content">
              <div className="donut-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={risks}
                      dataKey="total"
                      nameKey="risk_level"
                      innerRadius="62%"
                      outerRadius="88%"
                      paddingAngle={2}
                      stroke="none"
                    >
                      {risks.map((item) => (
                        <Cell
                          key={item.risk_level}
                          fill={riskColors[item.risk_level] || "#929bb2"}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="donut-center">
                  <strong>{totalRiskAlerts}</strong>
                  <span>Alerts</span>
                </div>
              </div>

              <div className="risk-legend">
                {risks.map((item) => (
                  <div className="risk-legend-item" key={item.risk_level}>
                    <span
                      className="risk-color"
                      style={{ background: riskColors[item.risk_level] || "#929bb2" }}
                    />
                    <span>{item.risk_level} Risk</span>
                    <strong>{item.total}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Bottom Grid: Recent Alerts & Investigations by Status */}
      <div className="bottom-grid">
        <section className="panel alerts-panel">
          <div className="panel-header">
            <h2>Recent Alerts</h2>
            <span>{alerts.length} records &bull; click row for details</span>
          </div>

          <div className="table-wrapper">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Alert ID</th>
                  <th>Store</th>
                  <th>SKU</th>
                  <th>Rule</th>
                  <th>Risk Score</th>
                  <th>Status</th>
                  <th>Detected On</th>
                </tr>
              </thead>
              <tbody>
                {alerts.map((alert) => {
                  const risk =
                    alert.risk_score >= 70
                      ? "High"
                      : alert.risk_score >= 40
                      ? "Medium"
                      : "Low";

                  const isSelected = selectedAlertId === alert.alert_id;

                  return (
                    <tr
                      key={alert.alert_id}
                      onClick={() => onSelectAlert(alert)}
                      className={isSelected ? "selected-alert-row" : ""}
                      style={{ cursor: "pointer" }}
                    >
                      <td>
                        <strong>{alert.alert_id}</strong>
                      </td>
                      <td title={alert.store_name}>
                        {alert.store_name} ({alert.store_id})
                      </td>
                      <td title={alert.product_name}>
                        {alert.product_name} ({alert.sku_id})
                      </td>
                      <td>{alert.rule_code}</td>
                      <td>
                        <span className={`risk-badge ${risk.toLowerCase()}`}>
                          {alert.risk_score}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill status-${(alert.status || "").toLowerCase()}`}>
                          {alert.status}
                        </span>
                      </td>
                      <td>{new Date(alert.created_at).toLocaleString()}</td>
                    </tr>
                  );
                })}
                {alerts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="empty-state">
                      No shrinkage alerts found in the database.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel investigation-panel">
          <div className="panel-header">
            <h2>Investigations by Status</h2>
            <span>{totalInvestigations} total cases</span>
          </div>

          <div className="status-list">
            {(
              ["OPEN", "ASSIGNED", "INVESTIGATING", "RESOLVED", "ESCALATED"] as const
            ).map((status) => {
              const item = statuses.find((entry) => entry.status === status);
              const count = item?.total ?? 0;

              const colors: Record<string, string> = {
                OPEN: "#929bb2",
                ASSIGNED: "#3478ff",
                INVESTIGATING: "#7138ee",
                RESOLVED: "#2c9b58",
                ESCALATED: "#f04444",
              };

              const percentage =
                totalInvestigations > 0 ? (count / totalInvestigations) * 100 : 0;

              return (
                <div className="status-row" key={status}>
                  <span className="status-name">{status}</span>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${percentage}%`,
                        background: colors[status],
                      }}
                    />
                  </div>
                  <strong>{count}</strong>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Dashboard Footer Stats */}
      <div className="dashboard-footer">
        <span>
          Total Inventory Movements: <strong>{summary.total_movements.toLocaleString()}</strong>
        </span>
        <span>
          Cycle Counts Executed: <strong>{summary.total_cycle_counts.toLocaleString()}</strong>
        </span>
        <span>
          Shortage Instances: <strong>{summary.shortage_counts.toLocaleString()}</strong>
        </span>
        <span>
          Total Shortage Units: <strong>{summary.shortage_units.toLocaleString()}</strong>
        </span>
      </div>
    </section>
  );
};

