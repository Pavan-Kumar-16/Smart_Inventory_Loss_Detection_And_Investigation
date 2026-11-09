import React, { useState } from "react";
import {
  X,
  Store,
  Box,
  Calendar,
  Shield,
  FileSearch,
  ExternalLink,
  PlusCircle,
  FileText,
} from "lucide-react";
import type { RecentAlert, Investigation } from "../types";

interface AlertDetailsModalProps {
  alert: RecentAlert | null;
  investigations: Investigation[];
  isCreatingInvestigation?: boolean;
  onClose: () => void;
  onCreateInvestigation: (alertId: string, assignedTo?: string) => Promise<void>;
  onViewInvestigation: (investigation: Investigation) => void;
}

export const AlertDetailsModal: React.FC<AlertDetailsModalProps> = ({
  alert,
  investigations,
  isCreatingInvestigation = false,
  onClose,
  onCreateInvestigation,
  onViewInvestigation,
}) => {
  const [assignedToInput, setAssignedToInput] = useState("");
  const [showAssignInput, setShowAssignInput] = useState(false);

  if (!alert) return null;

  // Check if an investigation already exists for this alert
  const existingInvestigation = investigations.find(
    (inv) => inv.alert_id === alert.alert_id
  );

  const riskCategory =
    alert.risk_score >= 70
      ? "High"
      : alert.risk_score >= 40
      ? "Medium"
      : "Low";

  const handleCreate = async () => {
    await onCreateInvestigation(
      alert.alert_id,
      assignedToInput.trim() ? assignedToInput.trim() : undefined
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content alert-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Alert Details"
      >
        <div className="modal-header">
          <div className="modal-title-group">
            <span className={`risk-badge ${riskCategory.toLowerCase()}`}>
              {riskCategory} Risk ({alert.risk_score})
            </span>
            <h2>Alert Details &bull; {alert.alert_id}</h2>
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

        <div className="modal-body">
          <div className="details-grid">
            <div className="detail-item">
              <span className="detail-label">
                <Store size={15} /> Store Facility
              </span>
              <strong>{alert.store_name}</strong>
              <small>ID: {alert.store_id}</small>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Box size={15} /> SKU Tracked
              </span>
              <strong>{alert.product_name}</strong>
              <small>SKU: {alert.sku_id}</small>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Shield size={15} /> Detection Rule
              </span>
              <strong>{alert.rule_code}</strong>
              <small>Automated Engine</small>
            </div>

            <div className="detail-item">
              <span className="detail-label">
                <Calendar size={15} /> Detection Timestamp
              </span>
              <strong>{new Date(alert.created_at).toLocaleDateString()}</strong>
              <small>{new Date(alert.created_at).toLocaleTimeString()}</small>
            </div>
          </div>

          <div className="detail-block">
            <label className="block-label">Anomaly Description & Reason</label>
            <div className="reason-container">
              <p>{alert.reason}</p>
            </div>
          </div>

          {/* Investigation status / actions */}
          <div className="investigation-action-box">
            {existingInvestigation ? (
              <div className="existing-investigation-banner">
                <div className="existing-inv-info">
                  <div className="existing-inv-icon">
                    <FileText size={22} color="#6038df" />
                  </div>
                  <div>
                    <strong>Investigation Already Created</strong>
                    <p>
                      Case ID: <strong>{existingInvestigation.investigation_id}</strong> &bull; Status:{" "}
                      <span className={`status-pill status-${(existingInvestigation.status || "").toLowerCase()}`}>
                        {existingInvestigation.status}
                      </span>
                      {existingInvestigation.assigned_to && (
                        <span> &bull; Investigator: <strong>{existingInvestigation.assigned_to}</strong></span>
                      )}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => {
                    onClose();
                    onViewInvestigation(existingInvestigation);
                  }}
                >
                  <ExternalLink size={16} /> View Investigation
                </button>
              </div>
            ) : (
              <div className="create-investigation-panel">
                <div className="create-inv-header">
                  <div className="create-inv-icon">
                    <FileSearch size={22} color="#6038df" />
                  </div>
                  <div className="create-inv-text">
                    <h4>No Active Investigation</h4>
                    <p>
                      Open an investigation case to formally triage this discrepancy, assign staff, and record audit notes.
                    </p>
                  </div>
                </div>

                {!showAssignInput ? (
                  <div className="create-btn-group">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAssignInput(true)}
                    >
                      Assign Investigator...
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleCreate}
                      disabled={isCreatingInvestigation}
                    >
                      <PlusCircle size={16} />
                      {isCreatingInvestigation ? "Creating Case..." : "Create Investigation"}
                    </button>
                  </div>
                ) : (
                  <div className="assign-input-group">
                    <label className="modal-form-label">
                      Assign to Employee ID <span className="optional-tag">(optional)</span>
                    </label>
                    <input
                      type="text"
                      className="modal-form-input"
                      placeholder="e.g. EMP-000001"
                      value={assignedToInput}
                      onChange={(e) => setAssignedToInput(e.target.value)}
                    />
                    <div className="create-btn-group" style={{ marginTop: "6px" }}>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowAssignInput(false)}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleCreate}
                        disabled={isCreatingInvestigation}
                      >
                        <FileSearch size={16} />
                        {isCreatingInvestigation ? "Creating Case..." : "Confirm & Create"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
