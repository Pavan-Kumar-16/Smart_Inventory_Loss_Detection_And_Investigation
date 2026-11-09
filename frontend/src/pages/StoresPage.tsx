import React, { useState, useMemo } from "react";
import {
  Search,
  Building,
  AlertTriangle,
  FileText,
  CheckCircle,
  X,
  RotateCw,
  ShieldCheck,
  Filter,
} from "lucide-react";
import type { DerivedStore, RecentAlert, Investigation } from "../types";

interface StoresPageProps {
  totalStoresCount?: number;
  alerts: RecentAlert[];
  investigations: Investigation[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectAlert: (alert: RecentAlert) => void;
  onSelectInvestigation: (investigation: Investigation) => void;
}

export const StoresPage: React.FC<StoresPageProps> = ({
  totalStoresCount = 10,
  alerts,
  investigations,
  loading,
  onRefresh,
  onSelectAlert,
  onSelectInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "WITH_CASES" | "WITH_ALERTS" | "HIGH_RISK">("ALL");
  const [selectedStore, setSelectedStore] = useState<DerivedStore | null>(null);

  // Derive stores with actual database data from recent alerts (which join store_name from stores table) and investigations
  const derivedStores: DerivedStore[] = useMemo(() => {
    const storeMap = new Map<string, DerivedStore>();

    // Process alerts that include verified store_id and store_name from the database
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

    // Cross-reference with investigations (which provide store_id and case activity)
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

  const totalRegistered = totalStoresCount || 10;
  const identifiedCount = derivedStores.length;
  const unaffectedCount = Math.max(0, totalRegistered - identifiedCount);
  const storesWithCasesCount = derivedStores.filter((s) => s.investigation_count > 0).length;
  const storesWithAlertsCount = derivedStores.filter((s) => s.alert_count > 0).length;

  const filteredStores = useMemo(() => {
    return derivedStores.filter((store) => {
      // Search matching either real store_id or verified store_name
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = store.store_id.toLowerCase().includes(q);
        const matchesName = store.store_name
          ? store.store_name.toLowerCase().includes(q)
          : false;
        if (!matchesId && !matchesName) return false;
      }

      // Filter by activity
      if (filterType === "WITH_CASES" && store.investigation_count === 0) {
        return false;
      }
      if (filterType === "WITH_ALERTS" && store.alert_count === 0) {
        return false;
      }
      if (filterType === "HIGH_RISK" && store.highest_risk < 70) {
        return false;
      }

      return true;
    });
  }, [derivedStores, searchQuery, filterType]);

  // Selected store details
  const storeAlerts = useMemo(() => {
    if (!selectedStore) return [];
    return alerts.filter((a) => a.store_id === selectedStore.store_id);
  }, [alerts, selectedStore]);

  const storeInvestigations = useMemo(() => {
    if (!selectedStore) return [];
    return investigations.filter((i) => i.store_id === selectedStore.store_id);
  }, [investigations, selectedStore]);

  return (
    <section className="dashboard-content">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card blue-card">
          <div className="kpi-icon blue-icon">
            <Building size={30} />
          </div>
          <div className="kpi-details">
            <span>Total Registered Stores</span>
            <strong>{totalRegistered}</strong>
            <small>Active facilities in MySQL</small>
          </div>
        </div>

        <div className="kpi-card purple-card">
          <div className="kpi-icon purple-icon">
            <AlertTriangle size={30} />
          </div>
          <div className="kpi-details">
            <span>Stores with Loss Alerts</span>
            <strong>{storesWithAlertsCount}</strong>
            <small>Discrepancies identified</small>
          </div>
        </div>

        <div className="kpi-card red-card">
          <div className="kpi-icon red-icon">
            <FileText size={30} />
          </div>
          <div className="kpi-details">
            <span>Stores with Active Cases</span>
            <strong>{storesWithCasesCount}</strong>
            <small>Under investigation</small>
          </div>
        </div>

        <div className="kpi-card green-card">
          <div className="kpi-icon green-icon">
            <ShieldCheck size={30} />
          </div>
          <div className="kpi-details">
            <span>Unaffected Facilities</span>
            <strong>{unaffectedCount}</strong>
            <small>Zero active shrinkage alerts</small>
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
              placeholder="Search by store ID (e.g. STORE-000001) or store name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects-group">
            <label className="filter-label">
              <Filter size={15} /> Filter:
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              >
                <option value="ALL">All Identified ({identifiedCount})</option>
                <option value="WITH_CASES">With Active Cases ({storesWithCasesCount})</option>
                <option value="WITH_ALERTS">With Loss Alerts ({storesWithAlertsCount})</option>
                <option value="HIGH_RISK">High Risk (&gt;= 70)</option>
              </select>
            </label>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh store activity from database"
            >
              <RotateCw size={15} /> Refresh Stores
            </button>
          </div>
        </div>
      </div>

      {/* Stores Grid / Cards */}
      <div className="stores-grid">
        {filteredStores.map((store) => (
          <div
            key={store.store_id}
            className="panel store-card"
            onClick={() => setSelectedStore(store)}
            style={{ cursor: "pointer" }}
          >
            <div className="store-card-header">
              <div className="store-icon-box">
                <Building size={22} color="#6038df" />
              </div>
              <div className="store-badges-group">
                {store.highest_risk >= 70 && (
                  <span className="risk-badge high">Risk {store.highest_risk}</span>
                )}
                <span className="store-status-badge">
                  <CheckCircle size={13} color="#2c9b58" /> {store.status}
                </span>
              </div>
            </div>

            <h3 className="store-name">
              {store.store_name || store.store_id}
            </h3>
            <div className="store-id-row">
              <span>Facility ID: <strong>{store.store_id}</strong></span>
            </div>

            <div className="store-metrics-row">
              <div className="store-metric">
                <span>Alerts</span>
                <strong>{store.alert_count}</strong>
              </div>
              <div className="store-metric">
                <span>Cases</span>
                <strong>{store.investigation_count}</strong>
              </div>
              <div className="store-metric">
                <span>Peak Risk</span>
                <strong className={store.highest_risk >= 70 ? "text-danger" : ""}>
                  {store.highest_risk}
                </strong>
              </div>
            </div>

            <div className="store-card-footer">
              <button type="button" className="btn btn-text">
                View Facility Breakdown &rarr;
              </button>
            </div>
          </div>
        ))}

        {/* Clear, distinct card representing registered stores without current alerts */}
        {unaffectedCount > 0 && !searchQuery.trim() && filterType === "ALL" && (
          <div className="panel store-card store-card-unaffected">
            <div className="store-card-header">
              <div className="store-icon-box store-icon-unaffected">
                <ShieldCheck size={22} color="#2c9b58" />
              </div>
              <span className="store-status-badge store-status-clean">
                <CheckCircle size={13} color="#2c9b58" /> 0 Discrepancies
              </span>
            </div>

            <h3 className="store-name">{unaffectedCount} Registered Facilities</h3>
            <div className="store-id-row">
              <span>Zero current loss alerts in MySQL</span>
            </div>

            <div className="store-metrics-row">
              <div className="store-metric">
                <span>Facilities</span>
                <strong>{unaffectedCount}</strong>
              </div>
              <div className="store-metric">
                <span>Alerts</span>
                <strong>0</strong>
              </div>
              <div className="store-metric">
                <span>Cases</span>
                <strong>0</strong>
              </div>
            </div>

            <div className="store-card-footer">
              <span className="unaffected-note">
                0 Discrepancy Records
              </span>
            </div>
          </div>
        )}

        {filteredStores.length === 0 && (
          <div className="panel" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px" }}>
            <Building size={32} color="#929bb2" style={{ margin: "0 auto 12px" }} />
            <p>No stores match your search query.</p>
          </div>
        )}
      </div>

      {/* Store Details Modal */}
      {selectedStore && (
        <div className="modal-backdrop" onClick={() => setSelectedStore(null)}>
          <div
            className="modal-content store-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <Building size={22} color="#6038df" />
                <h3>
                  {selectedStore.store_name ? `${selectedStore.store_name} (${selectedStore.store_id})` : selectedStore.store_id}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setSelectedStore(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Facility ID</span>
                  <strong>{selectedStore.store_id}</strong>
                </div>
                {selectedStore.store_name && (
                  <div className="detail-item">
                    <span className="detail-label">Store Name</span>
                    <strong>{selectedStore.store_name}</strong>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <strong>{selectedStore.status}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Loss Alerts</span>
                  <strong>{storeAlerts.length}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Open Cases</span>
                  <strong>{storeInvestigations.length}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Peak Risk Score</span>
                  <strong>{selectedStore.highest_risk}</strong>
                </div>
              </div>

              {/* Related Alerts */}
              <div className="modal-sub-section">
                <h4>
                  <AlertTriangle size={16} /> Recent Store Loss Alerts ({storeAlerts.length})
                </h4>
                {storeAlerts.length === 0 ? (
                  <p className="empty-state">No alerts recorded for this facility.</p>
                ) : (
                  <div className="modal-mini-list">
                    {storeAlerts.map((a) => (
                      <div
                        key={a.alert_id}
                        className="modal-mini-item clickable"
                        onClick={() => {
                          setSelectedStore(null);
                          onSelectAlert(a);
                        }}
                      >
                        <div className="modal-mini-item-content">
                          <strong>{a.alert_id} &bull; {a.product_name}</strong>
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
                  <FileText size={16} /> Active Investigations ({storeInvestigations.length})
                </h4>
                {storeInvestigations.length === 0 ? (
                  <p className="empty-state">No investigations open for this facility.</p>
                ) : (
                  <div className="modal-mini-list">
                    {storeInvestigations.map((i) => (
                      <div
                        key={i.investigation_id}
                        className="modal-mini-item clickable"
                        onClick={() => {
                          setSelectedStore(null);
                          onSelectInvestigation(i);
                        }}
                      >
                        <div className="modal-mini-item-content">
                          <strong>{i.investigation_id}</strong>
                          <p>SKU: {i.sku_id} &bull; Lead: {i.assigned_to || "Unassigned"}</p>
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
                onClick={() => setSelectedStore(null)}
              >
                Close Facility Overview
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
