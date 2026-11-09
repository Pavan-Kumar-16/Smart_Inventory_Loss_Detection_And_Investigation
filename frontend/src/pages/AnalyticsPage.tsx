import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import {
  Play,
  RotateCw,
  TrendingDown,
  Building,
  Box,
  CheckCircle2,
  AlertTriangle,
  Award,
  Zap,
} from "lucide-react";
import type {
  DashboardSummary,
  RiskDistribution,
  InvestigationStatus,
  AlertTrend,
  Investigation,
  RecentAlert,
  AnomalyValidationResult,
} from "../types";
import { detectionApi } from "../services/detectionApi";

interface AnalyticsPageProps {
  summary: DashboardSummary | null;
  risks: RiskDistribution[];
  statuses: InvestigationStatus[];
  trend: AlertTrend[];
  investigations: Investigation[];
  alerts: RecentAlert[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onShowToast: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string
  ) => void;
}

const riskColors: Record<string, string> = {
  High: "#f04444",
  Medium: "#ffc43d",
  Low: "#36c995",
};

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  summary,
  risks,
  statuses,
  trend,
  investigations,
  alerts,
  loading,
  onRefresh,
  onShowToast,
}) => {
  const [validationResult, setValidationResult] = useState<AnomalyValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  // Compute store comparisons from investigations & alerts
  const storeComparison = useMemo(() => {
    const map = new Map<string, { store_id: string; alert_count: number; avg_risk: number; risk_sum: number }>();

    investigations.forEach((inv) => {
      const cur = map.get(inv.store_id) || {
        store_id: inv.store_id,
        alert_count: 0,
        avg_risk: 0,
        risk_sum: 0,
      };
      cur.alert_count++;
      cur.risk_sum += Number(inv.risk_score || 0);
      cur.avg_risk = Math.round(cur.risk_sum / cur.alert_count);
      map.set(inv.store_id, cur);
    });

    alerts.forEach((alert) => {
      if (!map.has(alert.store_id)) {
        map.set(alert.store_id, {
          store_id: alert.store_id,
          alert_count: 1,
          avg_risk: alert.risk_score,
          risk_sum: alert.risk_score,
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => b.alert_count - a.alert_count);
  }, [investigations, alerts]);

  // Compute SKU loss analysis from investigations & alerts
  const skuAnalysis = useMemo(() => {
    const map = new Map<string, { sku_id: string; count: number; avg_risk: number; risk_sum: number }>();

    investigations.forEach((inv) => {
      const cur = map.get(inv.sku_id) || {
        sku_id: inv.sku_id,
        count: 0,
        avg_risk: 0,
        risk_sum: 0,
      };
      cur.count++;
      cur.risk_sum += Number(inv.risk_score || 0);
      cur.avg_risk = Math.round(cur.risk_sum / cur.count);
      map.set(inv.sku_id, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.count - a.count).slice(0, 10);
  }, [investigations]);

  // Compute rule distribution
  const ruleDistribution = useMemo(() => {
    const map = new Map<string, number>();
    alerts.forEach((a) => {
      map.set(a.rule_code, (map.get(a.rule_code) || 0) + 1);
    });
    investigations.forEach((i) => {
      if (!map.has(i.rule_code)) {
        map.set(i.rule_code, 1);
      }
    });
    return Array.from(map.entries()).map(([rule, total]) => ({ rule, total }));
  }, [alerts, investigations]);

  // Run anomaly validation
  const handleRunValidation = async () => {
    try {
      setIsValidating(true);
      const res = await detectionApi.validateAnomalies();
      setValidationResult(res);
      onShowToast(
        "success",
        "Model Validation Complete",
        `Tested ${res.total_scenarios} scenarios. Accuracy: ${res.accuracy}%, F1-Score: ${res.f1_score}%.`
      );
    } catch (err) {
      onShowToast(
        "error",
        "Validation Failed",
        err instanceof Error ? err.message : "Validation suite could not execute."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const totalInvestigations = statuses.reduce((sum, item) => sum + item.total, 0);
  const resolvedCount = statuses.find((s) => s.status === "RESOLVED")?.total || 0;
  const resolutionRate =
    totalInvestigations > 0 ? Math.round((resolvedCount / totalInvestigations) * 100) : 0;

  return (
    <section className="dashboard-content">
      {/* Top Banner */}
      <div className="alerts-header-actions">
        <div className="engine-triggers-group">
          <div className="engine-triggers-title">
            <Award size={18} color="#6541d8" />
            <span>Detection Engine Benchmark & Validation:</span>
          </div>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleRunValidation}
            disabled={isValidating}
          >
            <Play size={14} />
            {isValidating ? "Validating Scenarios..." : "Run Anomaly Validation Suite"}
          </button>
        </div>

        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
        >
          <RotateCw size={15} /> Refresh Analytics
        </button>
      </div>

      {/* KPI Summaries */}
      {summary && (
        <div className="kpi-grid">
          <div className="kpi-card purple-card">
            <div className="kpi-icon purple-icon">
              <TrendingDown size={30} />
            </div>
            <div className="kpi-details">
              <span>Shortage Units</span>
              <strong>{summary.shortage_units.toLocaleString()}</strong>
              <small>From {summary.shortage_counts.toLocaleString()} count events</small>
            </div>
          </div>

          <div className="kpi-card blue-card">
            <div className="kpi-icon blue-icon">
              <Zap size={30} />
            </div>
            <div className="kpi-details">
              <span>Discrepancy Ratio</span>
              <strong>
                {summary.total_cycle_counts > 0
                  ? `${((summary.shortage_counts / summary.total_cycle_counts) * 100).toFixed(1)}%`
                  : "0%"}
              </strong>
              <small>Counts with expected &gt; counted</small>
            </div>
          </div>

          <div className="kpi-card green-card">
            <div className="kpi-icon green-icon">
              <CheckCircle2 size={30} />
            </div>
            <div className="kpi-details">
              <span>Case Resolution Rate</span>
              <strong>{resolutionRate}%</strong>
              <small>{resolvedCount} of {totalInvestigations} resolved</small>
            </div>
          </div>

          <div className="kpi-card red-card">
            <div className="kpi-icon red-icon">
              <AlertTriangle size={30} />
            </div>
            <div className="kpi-details">
              <span>Total Shrinkage Alerts</span>
              <strong>{summary.total_alerts.toLocaleString()}</strong>
              <small>{summary.active_investigations} currently open</small>
            </div>
          </div>
        </div>
      )}

      {/* Validation results banner if run */}
      {validationResult && (
        <div className="panel validation-results-panel">
          <div className="panel-header">
            <h2>Anomaly Classification Benchmark Report</h2>
            <span className="results-count-badge">
              {validationResult.passed} / {validationResult.total_scenarios} Passed
            </span>
          </div>

          <div className="validation-metrics-grid">
            <div className="validation-metric-box">
              <span>Accuracy</span>
              <strong>{validationResult.accuracy}%</strong>
            </div>
            <div className="validation-metric-box">
              <span>Precision</span>
              <strong>{validationResult.precision}%</strong>
            </div>
            <div className="validation-metric-box">
              <span>Recall</span>
              <strong>{validationResult.recall}%</strong>
            </div>
            <div className="validation-metric-box">
              <span>F1-Score</span>
              <strong>{validationResult.f1_score}%</strong>
            </div>
          </div>
        </div>
      )}

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Trend chart */}
        <section className="panel trend-panel">
          <div className="panel-header">
            <h2>7-Day Alert Velocity Trend</h2>
            <span>Real-time from shrinkage_alerts table</span>
          </div>
          <div className="trend-chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend}>
                <CartesianGrid stroke="#e8eaf2" vertical={false} />
                <XAxis dataKey="alert_date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Area
                  dataKey="total"
                  stroke="#6938ef"
                  fill="#7145f5"
                  fillOpacity={0.15}
                  name="Alerts"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Risk Distribution Donut */}
        <section className="panel risk-panel">
          <div className="panel-header">
            <h2>Risk Tier Distribution</h2>
          </div>
          <div className="risk-content">
            <div className="donut-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={risks}
                    dataKey="total"
                    nameKey="risk_level"
                    innerRadius="60%"
                    outerRadius="85%"
                    paddingAngle={3}
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
        </section>
      </div>

      {/* Comparisons Row */}
      <div className="charts-grid">
        {/* Store Level Comparison */}
        <section className="panel">
          <div className="panel-header">
            <div className="panel-title-with-badge">
              <Building size={18} color="#6038df" />
              <h2>Store Anomaly Comparison</h2>
            </div>
            <span>Cases & alerts per store</span>
          </div>

          {storeComparison.length === 0 ? (
            <p className="empty-state">No store alert data available.</p>
          ) : (
            <div className="trend-chart" style={{ height: "260px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={storeComparison}>
                  <CartesianGrid stroke="#e8eaf2" vertical={false} />
                  <XAxis dataKey="store_id" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="alert_count" fill="#6938ef" name="Alerts / Cases" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Rule Distribution */}
        <section className="panel">
          <div className="panel-header">
            <h2>Detection Rule Trigger Frequency</h2>
          </div>
          <div className="table-wrapper">
            <table className="alerts-table">
              <thead>
                <tr>
                  <th>Rule Code</th>
                  <th>Total Detections</th>
                  <th>Scope</th>
                </tr>
              </thead>
              <tbody>
                {ruleDistribution.map((item) => (
                  <tr key={item.rule}>
                    <td>
                      <code className="rule-code-badge">{item.rule}</code>
                    </td>
                    <td>
                      <strong>{item.total}</strong>
                    </td>
                    <td>Cycle Counts & Movements</td>
                  </tr>
                ))}
                {ruleDistribution.length === 0 && (
                  <tr>
                    <td colSpan={3} className="empty-state">
                      No rule triggers recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* SKU Level Loss Analysis Table */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <Box size={18} color="#6038df" />
            <h2>High Vulnerability SKU Analysis</h2>
          </div>
          <span>Top items by case frequency</span>
        </div>

        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Discrepancy Cases</th>
                <th>Average Case Risk Score</th>
                <th>Risk Category</th>
              </tr>
            </thead>
            <tbody>
              {skuAnalysis.map((item) => {
                const riskCat =
                  item.avg_risk >= 70 ? "high" : item.avg_risk >= 40 ? "medium" : "low";
                return (
                  <tr key={item.sku_id}>
                    <td>
                      <strong>{item.sku_id}</strong>
                    </td>
                    <td>{item.count}</td>
                    <td>{item.avg_risk}</td>
                    <td>
                      <span className={`risk-badge ${riskCat}`}>
                        {item.avg_risk >= 70
                          ? "High Risk"
                          : item.avg_risk >= 40
                          ? "Medium Risk"
                          : "Low Risk"}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {skuAnalysis.length === 0 && (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No SKU case data recorded.
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

