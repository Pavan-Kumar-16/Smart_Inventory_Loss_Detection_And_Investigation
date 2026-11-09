import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  RotateCw,
  FileSearch,
  X,
} from "lucide-react";
import type { Investigation, RecentAlert } from "../types";
import { investigationApi } from "../services/investigationApi";

interface InvestigationsPageProps {
  investigations: Investigation[];
  alerts: RecentAlert[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectInvestigation: (investigation: Investigation) => void;
  onShowToast: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string
  ) => void;
}

export const InvestigationsPage: React.FC<InvestigationsPageProps> = ({
  investigations,
  alerts,
  loading,
  onRefresh,
  onSelectInvestigation,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [storeFilter, setStoreFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "risk" | "id">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Create Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState("");
  const [assigneeInput, setAssigneeInput] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Available alerts without investigations
  const uninvestigatedAlerts = useMemo(() => {
    const existingAlertIds = new Set(investigations.map((i) => i.alert_id));
    return alerts.filter((a) => !existingAlertIds.has(a.alert_id));
  }, [alerts, investigations]);

  // Unique stores in investigations
  const uniqueStores = useMemo(() => {
    const set = new Set<string>();
    investigations.forEach((i) => {
      if (i.store_id) set.add(i.store_id);
    });
    return Array.from(set);
  }, [investigations]);

  // Counts by status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ALL: investigations.length,
      OPEN: 0,
      ASSIGNED: 0,
      INVESTIGATING: 0,
      RESOLVED: 0,
      ESCALATED: 0,
    };
    investigations.forEach((i) => {
      if (counts[i.status] !== undefined) {
        counts[i.status]++;
      }
    });
    return counts;
  }, [investigations]);

  // Filtered & sorted investigations
  const filteredInvestigations = useMemo(() => {
    return investigations
      .filter((inv) => {
        if (statusFilter !== "ALL" && inv.status !== statusFilter) {
          return false;
        }

        if (storeFilter !== "ALL" && inv.store_id !== storeFilter) {
          return false;
        }

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            inv.investigation_id.toLowerCase().includes(q) ||
            inv.alert_id.toLowerCase().includes(q) ||
            inv.store_id.toLowerCase().includes(q) ||
            inv.sku_id.toLowerCase().includes(q) ||
            inv.rule_code.toLowerCase().includes(q) ||
            (inv.assigned_to && inv.assigned_to.toLowerCase().includes(q)) ||
            (inv.outcome && inv.outcome.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff: number;
        if (sortBy === "risk") {
          diff = a.risk_score - b.risk_score;
        } else if (sortBy === "id") {
          diff = a.investigation_id.localeCompare(b.investigation_id);
        } else {
          diff = new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime();
        }
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [investigations, statusFilter, storeFilter, searchQuery, sortBy, sortOrder]);

  const handleCreateInvestigation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAlertId) {
      onShowToast("warning", "Missing Alert ID", "Please select an alert for this investigation.");
      return;
    }

    try {
      setIsCreating(true);
      const res = await investigationApi.create({
        alert_id: selectedAlertId,
        assigned_to: assigneeInput.trim() || undefined,
        changed_by: "EMP-000001",
      });

      onShowToast(
        "success",
        "Investigation Created",
        `Created case ${res.investigation_id} for alert ${res.alert_id}.`
      );
      setIsCreateModalOpen(false);
      setSelectedAlertId("");
      setAssigneeInput("");
      await onRefresh();
    } catch (err) {
      onShowToast(
        "error",
        "Creation Failed",
        err instanceof Error ? err.message : "Could not create investigation case."
      );
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <section className="dashboard-content">
      {/* Top Action Bar */}
      <div className="alerts-header-actions">
        <div className="status-tabs-row">
          {(["ALL", "OPEN", "ASSIGNED", "INVESTIGATING", "RESOLVED", "ESCALATED"] as const).map(
            (status) => (
              <button
                key={status}
                type="button"
                className={`status-tab-btn ${statusFilter === status ? "active" : ""}`}
                onClick={() => setStatusFilter(status)}
              >
                <span>{status}</span>
                <span className="tab-count">{statusCounts[status] || 0}</span>
              </button>
            )
          )}
        </div>

        <div className="header-right-buttons">
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <PlusCircle size={15} /> Open New Case
          </button>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={onRefresh}
            disabled={loading}
          >
            <RotateCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="panel filter-bar-panel">
        <div className="filter-controls-row">
          <div className="filter-search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search by Case ID, Alert ID, Store, SKU, or Assigned Lead..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects-group">
            {uniqueStores.length > 0 && (
              <label className="filter-label">
                <Filter size={15} /> Store:
                <select
                  value={storeFilter}
                  onChange={(e) => setStoreFilter(e.target.value)}
                >
                  <option value="ALL">All Stores</option>
                  {uniqueStores.map((id) => (
                    <option key={id} value={id}>
                      {id}
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
                    "date" | "risk" | "id",
                    "asc" | "desc"
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <option value="date-desc">Newest Opened First</option>
                <option value="date-asc">Oldest Opened First</option>
                <option value="risk-desc">Highest Alert Risk First</option>
                <option value="risk-asc">Lowest Alert Risk First</option>
                <option value="id-asc">Case ID (A-Z)</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {/* Investigations Table */}
      <div className="panel alerts-panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <h2>Active & Closed Investigation Cases</h2>
            <span className="results-count-badge">
              {filteredInvestigations.length} cases displayed
            </span>
          </div>
          <span className="panel-subtitle">Click row to manage status, notes & assignees</span>
        </div>

        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Investigation ID</th>
                <th>Alert Reference</th>
                <th>Store Facility</th>
                <th>SKU</th>
                <th>Detection Rule</th>
                <th>Risk Score</th>
                <th>Assigned Lead</th>
                <th>Status</th>
                <th>Opened Date</th>
                <th>Closed Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredInvestigations.map((inv) => {
                const riskCat =
                  inv.risk_score >= 70
                    ? "high"
                    : inv.risk_score >= 40
                    ? "medium"
                    : "low";

                return (
                  <tr
                    key={inv.investigation_id}
                    onClick={() => onSelectInvestigation(inv)}
                    style={{ cursor: "pointer" }}
                  >
                    <td>
                      <strong>{inv.investigation_id}</strong>
                    </td>
                    <td>
                      <span className="alert-ref-link">{inv.alert_id}</span>
                    </td>
                    <td>{inv.store_id}</td>
                    <td>{inv.sku_id}</td>
                    <td>
                      <code className="rule-code-badge">{inv.rule_code}</code>
                    </td>
                    <td>
                      <span className={`risk-badge ${riskCat}`}>
                        {inv.risk_score}
                      </span>
                    </td>
                    <td>
                      {inv.assigned_to ? (
                        <span>{inv.assigned_to}</span>
                      ) : (
                        <span className="unassigned-text">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`status-pill status-${(inv.status || "").toLowerCase()}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td>{new Date(inv.opened_at).toLocaleDateString()}</td>
                    <td>
                      {inv.closed_at ? (
                        new Date(inv.closed_at).toLocaleDateString()
                      ) : (
                        <span className="in-progress-text">&mdash;</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {filteredInvestigations.length === 0 && (
                <tr>
                  <td colSpan={10} className="empty-state">
                    <FileSearch size={32} color="#929bb2" style={{ margin: "10px auto" }} />
                    <p>No investigations match the selected status and search criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Investigation Modal */}
      {isCreateModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateModalOpen(false)}>
          <div
            className="modal-content create-case-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <FileSearch size={22} color="#6038df" />
                <h3>Open Investigation Case</h3>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                title="Close modal"
                aria-label="Close modal"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateInvestigation}>
              <div className="modal-body">
                <p className="modal-intro-text">
                  Select an existing shrinkage alert to launch an investigation. Duplicate cases for the same alert are rejected by the backend.
                </p>

                <div className="modal-form-group">
                  <label htmlFor="target-alert-select" className="modal-form-label">
                    Target Shrinkage Alert <span className="required-star">*</span>
                  </label>
                  <select
                    id="target-alert-select"
                    className="modal-form-select"
                    value={selectedAlertId}
                    onChange={(e) => setSelectedAlertId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Anomaly Alert --</option>
                    {uninvestigatedAlerts.map((a) => (
                      <option key={a.alert_id} value={a.alert_id}>
                        {a.alert_id} &bull; {a.store_name} &bull; {a.product_name} (Risk: {a.risk_score})
                      </option>
                    ))}
                  </select>
                  {uninvestigatedAlerts.length === 0 ? (
                    <div className="modal-form-warning">
                      All currently loaded alerts already have assigned investigations!
                    </div>
                  ) : (
                    <p className="modal-form-help">
                      Available unassigned alerts: <strong>{uninvestigatedAlerts.length}</strong>
                    </p>
                  )}
                </div>

                <div className="modal-form-group">
                  <label htmlFor="assignee-input" className="modal-form-label">
                    Assign to Employee ID <span className="optional-tag">(optional)</span>
                  </label>
                  <input
                    id="assignee-input"
                    type="text"
                    className="modal-form-input"
                    placeholder="e.g. EMP-000001"
                    value={assigneeInput}
                    onChange={(e) => setAssigneeInput(e.target.value)}
                  />
                  <p className="modal-form-help">
                    Initial status will be <code>ASSIGNED</code> if employee is provided, or <code>OPEN</code> if empty.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isCreating || !selectedAlertId}
                >
                  {isCreating ? "Creating..." : "Create Investigation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
