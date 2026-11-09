import React, { useState, useMemo } from "react";
import {
  Search,
  Box,
  AlertTriangle,
  FileText,
  X,
  RotateCw,
  Package,
} from "lucide-react";
import type { DerivedSKU, RecentAlert, Investigation } from "../types";

interface SKUsPageProps {
  totalSkusCount?: number;
  totalShortageUnits?: number;
  alerts: RecentAlert[];
  investigations: Investigation[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectAlert: (alert: RecentAlert) => void;
  onSelectInvestigation: (investigation: Investigation) => void;
}

export const SKUsPage: React.FC<SKUsPageProps> = ({
  totalSkusCount = 0,
  totalShortageUnits = 0,
  alerts,
  investigations,
  loading,
  onRefresh,
  onSelectAlert,
  onSelectInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSku, setSelectedSku] = useState<DerivedSKU | null>(null);

  // Derive SKUs from alerts & investigations
  const derivedSkus: DerivedSKU[] = useMemo(() => {
    const map = new Map<string, DerivedSKU>();

    alerts.forEach((alert) => {
      const existing = map.get(alert.sku_id) || {
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
      map.set(alert.sku_id, existing);
    });

    investigations.forEach((inv) => {
      const existing = map.get(inv.sku_id) || {
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
      map.set(inv.sku_id, existing);
    });

    return Array.from(map.values()).sort((a, b) => b.alert_count - a.alert_count);
  }, [alerts, investigations]);

  const filteredSkus = useMemo(() => {
    if (!searchQuery.trim()) return derivedSkus;
    const q = searchQuery.toLowerCase();
    return derivedSkus.filter(
      (s) =>
        s.sku_id.toLowerCase().includes(q) ||
        s.product_name.toLowerCase().includes(q)
    );
  }, [derivedSkus, searchQuery]);

  const skuAlerts = useMemo(() => {
    if (!selectedSku) return [];
    return alerts.filter((a) => a.sku_id === selectedSku.sku_id);
  }, [alerts, selectedSku]);

  const skuInvestigations = useMemo(() => {
    if (!selectedSku) return [];
    return investigations.filter((i) => i.sku_id === selectedSku.sku_id);
  }, [investigations, selectedSku]);

  return (
    <section className="dashboard-content">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card green-card">
          <div className="kpi-icon green-icon">
            <Package size={26} />
          </div>
          <div className="kpi-details">
            <span>Total Catalog SKUs</span>
            <strong>{totalSkusCount.toLocaleString()}</strong>
            <small>Active items in database</small>
          </div>
        </div>

        <div className="kpi-card purple-card">
          <div className="kpi-icon purple-icon">
            <Box size={26} />
          </div>
          <div className="kpi-details">
            <span>Tracked for Discrepancy</span>
            <strong>{derivedSkus.length}</strong>
            <small>Items with loss records</small>
          </div>
        </div>

        <div className="kpi-card red-card">
          <div className="kpi-icon red-icon">
            <AlertTriangle size={26} />
          </div>
          <div className="kpi-details">
            <span>Total Shortage Units</span>
            <strong>{totalShortageUnits.toLocaleString()}</strong>
            <small>Discrepancies identified</small>
          </div>
        </div>

        <div className="kpi-card blue-card">
          <div className="kpi-icon blue-icon">
            <FileText size={26} />
          </div>
          <div className="kpi-details">
            <span>Active SKU Cases</span>
            <strong>{investigations.length}</strong>
            <small>Open &amp; under investigation</small>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel filter-bar-panel">
        <div className="filter-controls-row">
          <div className="filter-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search SKUs by product name or SKU ID (e.g. SKU-000001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RotateCw size={15} /> Refresh SKUs
          </button>
        </div>
      </div>

      {/* SKUs Table */}
      <div className="panel alerts-panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <Package size={20} color="#6038df" />
            <h2>Catalog SKUs Tracked for Loss</h2>
            <span className="results-count-badge">
              {filteredSkus.length} active items
            </span>
          </div>
          <span className="panel-subtitle">Click row for discrepancy history</span>
        </div>

        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>SKU ID</th>
                <th>Product Description</th>
                <th>Category</th>
                <th>Alert Frequency</th>
                <th>Open Investigations</th>
                <th>Peak Risk Score</th>
                <th>Recent Anomaly Note</th>
              </tr>
            </thead>
            <tbody>
              {filteredSkus.map((sku) => {
                const riskCat =
                  sku.highest_risk >= 70
                    ? "high"
                    : sku.highest_risk >= 40
                    ? "medium"
                    : "low";

                return (
                  <tr
                    key={sku.sku_id}
                    onClick={() => setSelectedSku(sku)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{sku.sku_id}</strong>
                    </td>
                    <td>{sku.product_name}</td>
                    <td>{sku.category}</td>
                    <td>
                      <span className="badge-count">{sku.alert_count}</span>
                    </td>
                    <td>
                      <span className="badge-count">{sku.investigation_count}</span>
                    </td>
                    <td>
                      <span className={`risk-badge ${riskCat}`}>
                        {sku.highest_risk}
                      </span>
                    </td>
                    <td className="truncate-cell">{sku.latest_reason || "None"}</td>
                  </tr>
                );
              })}

              {filteredSkus.length === 0 && (
                <tr>
                  <td colSpan={7} className="empty-state">
                    <Box size={32} color="#929bb2" style={{ margin: "10px auto" }} />
                    <p>No SKUs match your search query.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SKU Details Modal */}
      {selectedSku && (
        <div className="modal-backdrop" onClick={() => setSelectedSku(null)}>
          <div
            className="modal-content sku-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <Box size={22} color="#6038df" />
                <h3>{selectedSku.product_name} ({selectedSku.sku_id})</h3>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setSelectedSku(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">SKU ID</span>
                  <strong>{selectedSku.sku_id}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Product Name</span>
                  <strong>{selectedSku.product_name}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Associated Alerts</span>
                  <strong>{skuAlerts.length}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Peak Risk Score</span>
                  <strong>{selectedSku.highest_risk}</strong>
                </div>
              </div>

              {/* Related Alerts */}
              <div className="modal-sub-section">
                <h4>
                  <AlertTriangle size={16} /> Discrepancy Alerts for this SKU ({skuAlerts.length})
                </h4>
                {skuAlerts.length === 0 ? (
                  <p className="empty-state">No alerts recorded for this SKU.</p>
                ) : (
                  <div className="modal-mini-list">
                    {skuAlerts.map((a) => (
                      <div
                        key={a.alert_id}
                        className="modal-mini-item clickable"
                        onClick={() => {
                          setSelectedSku(null);
                          onSelectAlert(a);
                        }}
                      >
                        <div className="modal-mini-item-content">
                          <strong>{a.alert_id} &bull; Store: {a.store_id}</strong>
                          <p>{a.reason}</p>
                        </div>
                        <span className={`risk-badge ${a.risk_score >= 70 ? "high" : a.risk_score >= 40 ? "medium" : "low"}`}>
                          Risk {a.risk_score}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Related Investigations */}
              <div className="modal-sub-section">
                <h4>
                  <FileText size={16} /> Investigation Cases ({skuInvestigations.length})
                </h4>
                {skuInvestigations.length === 0 ? (
                  <p className="empty-state">No active investigations for this SKU.</p>
                ) : (
                  <div className="modal-mini-list">
                    {skuInvestigations.map((i) => (
                      <div
                        key={i.investigation_id}
                        className="modal-mini-item clickable"
                        onClick={() => {
                          setSelectedSku(null);
                          onSelectInvestigation(i);
                        }}
                      >
                        <div className="modal-mini-item-content">
                          <strong>{i.investigation_id}</strong>
                          <p>Store: {i.store_id} &bull; Assigned: {i.assigned_to || "Unassigned"}</p>
                        </div>
                        <span className={`status-pill status-${(i.status || "").toLowerCase()}`}>
                          {i.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedSku(null)}
              >
                Close SKU Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

