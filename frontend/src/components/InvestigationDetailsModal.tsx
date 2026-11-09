import React, { useState, useEffect } from "react";
import {
  X,
  UserCheck,
  Clock,
  Send,
  CheckCircle2,
  FileText,
  Building,
  Box,
  Calendar,
  AlertTriangle,
  History,
} from "lucide-react";
import type { Investigation, InvestigationHistory } from "../types";
import { investigationApi } from "../services/investigationApi";

interface InvestigationDetailsModalProps {
  investigationId: string | null;
  onClose: () => void;
  onRefreshData: () => Promise<void>;
  onShowToast: (type: "success" | "error" | "info" | "warning", title: string, message: string) => void;
  knownEmployees?: string[];
}

const ALLOWED_STATUSES = [
  "OPEN",
  "ASSIGNED",
  "INVESTIGATING",
  "RESOLVED",
  "ESCALATED",
] as const;

export const InvestigationDetailsModal: React.FC<InvestigationDetailsModalProps> = ({
  investigationId,
  onClose,
  onRefreshData,
  onShowToast,
  knownEmployees = [],
}) => {
  const [investigation, setInvestigation] = useState<Investigation | null>(null);
  const [history, setHistory] = useState<InvestigationHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tab state: "overview" | "history" | "actions"
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "actions">("overview");

  // Form states
  const [newStatus, setNewStatus] = useState<string>("");
  const [statusOutcome, setStatusOutcome] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [assigneeId, setAssigneeId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [newNote, setNewNote] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);

  const loadDetails = async (id: string) => {
    try {
      setIsLoading(true);
      setError("");
      const response = await investigationApi.getById(id);
      setInvestigation(response.investigation);
      setHistory(response.history);
      setNewStatus(response.investigation.status);
      setAssigneeId(response.investigation.assigned_to || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load investigation details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (investigationId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDetails(investigationId);
    }
  }, [investigationId]);

  if (!investigationId) return null;

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigation) return;

    if (newStatus === investigation.status) {
      onShowToast("info", "No Change", "Investigation already has this status.");
      return;
    }

    try {
      setIsUpdatingStatus(true);
      await investigationApi.updateStatus(investigation.investigation_id, {
        status: newStatus,
        outcome: newStatus === "RESOLVED" ? statusOutcome.trim() || undefined : undefined,
        notes: statusNotes.trim() || undefined,
        changed_by: "EMP-000001",
      });

      onShowToast("success", "Status Updated", `Case status changed to ${newStatus}.`);
      setStatusNotes("");
      setStatusOutcome("");
      await loadDetails(investigation.investigation_id);
      await onRefreshData();
    } catch (err) {
      onShowToast(
        "error",
        "Update Failed",
        err instanceof Error ? err.message : "Could not update status."
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigation) return;

    const trimmed = assigneeId.trim();
    if (!trimmed) {
      onShowToast("warning", "Missing Employee ID", "Please specify a valid employee ID.");
      return;
    }

    try {
      setIsAssigning(true);
      await investigationApi.assign(investigation.investigation_id, {
        assigned_to: trimmed,
        changed_by: "EMP-000001",
      });

      onShowToast("success", "Employee Assigned", `Case assigned to ${trimmed}.`);
      await loadDetails(investigation.investigation_id);
      await onRefreshData();
    } catch (err) {
      onShowToast(
        "error",
        "Assignment Failed",
        err instanceof Error ? err.message : "Could not assign employee. Ensure employee ID exists."
      );
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!investigation) return;

    const trimmed = newNote.trim();
    if (!trimmed) {
      onShowToast("warning", "Empty Note", "Please enter an investigation note.");
      return;
    }

    try {
      setIsAddingNote(true);
      await investigationApi.addNote(investigation.investigation_id, {
        notes: trimmed,
        changed_by: "EMP-000001",
      });

      onShowToast("success", "Note Added", "Note recorded to investigation history.");
      setNewNote("");
      await loadDetails(investigation.investigation_id);
      await onRefreshData();
    } catch (err) {
      onShowToast(
        "error",
        "Note Failed",
        err instanceof Error ? err.message : "Could not add note."
      );
    } finally {
      setIsAddingNote(false);
    }
  };

  const statusColorMap: Record<string, string> = {
    OPEN: "status-open",
    ASSIGNED: "status-assigned",
    INVESTIGATING: "status-investigating",
    RESOLVED: "status-resolved",
    ESCALATED: "status-escalated",
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content investigation-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Investigation Details"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            {investigation && (
              <span className={`status-pill ${statusColorMap[investigation.status] || ""}`}>
                {investigation.status}
              </span>
            )}
            <h2>Case File: {investigationId}</h2>
          </div>
          <button
            className="modal-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal tabs */}
        <div className="modal-nav-tabs">
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            <FileText size={16} /> Overview & Alert
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "actions" ? "active" : ""}`}
            onClick={() => setActiveTab("actions")}
          >
            <UserCheck size={16} /> Update & Assign
          </button>
          <button
            type="button"
            className={`modal-tab-btn ${activeTab === "history" ? "active" : ""}`}
            onClick={() => setActiveTab("history")}
          >
            <History size={16} /> Audit Trail ({history.length})
          </button>
        </div>

        <div className="modal-body">
          {isLoading && (
            <div className="modal-loading-state">
              <div className="loading-spinner" />
              <p>Loading real investigation data from database...</p>
            </div>
          )}

          {error && (
            <div className="dashboard-error">
              <strong>Error Loading Case</strong>
              <p>{error}</p>
              <button type="button" onClick={() => loadDetails(investigationId)}>
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && investigation && (
            <>
              {activeTab === "overview" && (
                <div className="tab-pane">
                  <div className="details-grid">
                    <div className="detail-item">
                      <span className="detail-label">
                        <AlertTriangle size={15} /> Associated Alert
                      </span>
                      <strong>{investigation.alert_id}</strong>
                      <small>Risk Score: {investigation.risk_score}</small>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">
                        <Building size={15} /> Store Facility
                      </span>
                      <strong>{investigation.store_id}</strong>
                      <small>Monitored Node</small>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">
                        <Box size={15} /> SKU Tracked
                      </span>
                      <strong>{investigation.sku_id}</strong>
                      <small>Rule: {investigation.rule_code}</small>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">
                        <UserCheck size={15} /> Assigned Lead
                      </span>
                      <strong>{investigation.assigned_to || "Unassigned"}</strong>
                      <small>Role: Investigator</small>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">
                        <Calendar size={15} /> Opened Date
                      </span>
                      <strong>{new Date(investigation.opened_at).toLocaleDateString()}</strong>
                      <small>{new Date(investigation.opened_at).toLocaleTimeString()}</small>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">
                        <Clock size={15} /> Closed Date
                      </span>
                      <strong>
                        {investigation.closed_at
                          ? new Date(investigation.closed_at).toLocaleDateString()
                          : "In Progress"}
                      </strong>
                      <small>
                        {investigation.closed_at
                          ? new Date(investigation.closed_at).toLocaleTimeString()
                          : "Active case"}
                      </small>
                    </div>
                  </div>

                  {investigation.outcome && (
                    <div className="outcome-banner">
                      <strong>Recorded Outcome:</strong>
                      <p>{investigation.outcome}</p>
                    </div>
                  )}

                  <div className="detail-block">
                    <label className="block-label">Shrinkage Alert Discrepancy Reason</label>
                    <div className="reason-container">
                      <p>{investigation.reason}</p>
                    </div>
                  </div>

                  {/* Add Quick Note Form */}
                  <div className="quick-note-section">
                    <h4>Add Case Progress Note</h4>
                    <form onSubmit={handleAddNote} className="note-form">
                      <textarea
                        rows={3}
                        placeholder="Log investigation findings, physical count confirmation, or interview details..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                        disabled={isAddingNote}
                      />
                      <div className="form-action-right">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={isAddingNote || !newNote.trim()}
                        >
                          <Send size={15} /> {isAddingNote ? "Saving Note..." : "Add Note"}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "actions" && (
                <div className="tab-pane">
                  <div className="action-panels-grid">
                    {/* Status update box */}
                    <div className="action-box">
                      <div className="action-box-header">
                        <CheckCircle2 size={18} color="#6038df" />
                        <h4>Update Case Status</h4>
                      </div>
                      <form onSubmit={handleUpdateStatus} className="modal-form">
                        <label>
                          Target Status:
                          <select
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            disabled={isUpdatingStatus}
                          >
                            {ALLOWED_STATUSES.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </label>

                        {newStatus === "RESOLVED" && (
                          <label>
                            Investigation Outcome / Findings:
                            <input
                              type="text"
                              placeholder="e.g. Discrepancy explained by return slip #1029"
                              value={statusOutcome}
                              onChange={(e) => setStatusOutcome(e.target.value)}
                              disabled={isUpdatingStatus}
                              required
                            />
                          </label>
                        )}

                        <label>
                          Transition Notes:
                          <textarea
                            rows={3}
                            placeholder="Reason for status change..."
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            disabled={isUpdatingStatus}
                          />
                        </label>

                        <button
                          type="submit"
                          className="btn btn-primary btn-block"
                          disabled={isUpdatingStatus}
                        >
                          {isUpdatingStatus ? "Updating Status..." : `Change Status to ${newStatus}`}
                        </button>
                      </form>
                    </div>

                    {/* Employee assignment box */}
                    <div className="action-box">
                      <div className="action-box-header">
                        <UserCheck size={18} color="#6038df" />
                        <h4>Assign / Reassign Staff</h4>
                      </div>
                      <form onSubmit={handleAssignEmployee} className="modal-form">
                        <p className="form-help">
                          Assign this case to a valid employee. Valid format is <code>EMP-000001</code> to <code>EMP-000030</code>.
                        </p>

                        <label>
                          Employee ID:
                          <input
                            type="text"
                            placeholder="e.g. EMP-000001"
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            disabled={isAssigning}
                          />
                        </label>

                        {knownEmployees.length > 0 && (
                          <div className="quick-assign-pills">
                            <small>Recently Active Staff:</small>
                            <div className="pills-row">
                              {knownEmployees.slice(0, 5).map((emp) => (
                                <button
                                  key={emp}
                                  type="button"
                                  className="mini-pill"
                                  onClick={() => setAssigneeId(emp)}
                                >
                                  {emp}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="submit"
                          className="btn btn-secondary btn-block"
                          disabled={isAssigning || !assigneeId.trim()}
                        >
                          {isAssigning ? "Assigning..." : "Save Assignment"}
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "history" && (
                <div className="tab-pane">
                  <div className="history-timeline">
                    {history.length === 0 ? (
                      <p className="empty-state">No audit logs recorded for this case.</p>
                    ) : (
                      history.map((entry, index) => {
                        const targetStatus = (entry.new_status || "").toUpperCase();
                        const badgeClass =
                          targetStatus === "RESOLVED"
                            ? "status-resolved"
                            : targetStatus === "INVESTIGATING"
                            ? "status-investigating"
                            : targetStatus === "ASSIGNED"
                            ? "status-assigned"
                            : targetStatus === "ESCALATED"
                            ? "status-escalated"
                            : "status-open";

                        return (
                          <div key={entry.history_id || index} className="timeline-item">
                            <div className="timeline-marker" />
                            <div className="timeline-content">
                              <div className="timeline-header">
                                <span className={`timeline-status-badge ${badgeClass}`}>
                                  {entry.previous_status
                                    ? `${entry.previous_status} → ${entry.new_status}`
                                    : `Initial: ${entry.new_status}`}
                                </span>
                                <span className="timeline-time">
                                  {new Date(entry.changed_at).toLocaleString()}
                                </span>
                              </div>
                              <p className="timeline-notes">
                                {entry.notes || "No notes entered for this action."}
                              </p>
                              <div className="timeline-footer">
                                <span>Action by: <strong>{entry.changed_by || "System"}</strong></span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close Case File
          </button>
        </div>
      </div>
    </div>
  );
};
