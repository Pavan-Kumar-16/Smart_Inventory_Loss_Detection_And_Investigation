import React from "react";
import { X, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";
import type { RecentAlert } from "../types";

interface NotificationDrawerProps {
  isOpen: boolean;
  alerts: RecentAlert[];
  onClose: () => void;
  onSelectAlert: (alert: RecentAlert) => void;
  onViewAllAlerts: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  alerts,
  onClose,
  onSelectAlert,
  onViewAllAlerts,
}) => {
  if (!isOpen) return null;

  const highRiskAlerts = alerts.filter((a) => a.risk_score >= 70);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="notification-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Notifications Drawer"
      >
        <div className="drawer-header">
          <div className="drawer-title-group">
            <ShieldAlert size={22} color="#6038df" />
            <h3>Loss Alerts & Notifications</h3>
          </div>
          <button
            className="drawer-close-btn"
            type="button"
            onClick={onClose}
            aria-label="Close notifications"
          >
            <X size={20} />
          </button>
        </div>

        <div className="drawer-body">
          {highRiskAlerts.length > 0 && (
            <div className="notification-section">
              <h4 className="section-title critical">
                <AlertTriangle size={15} /> High Priority Anomalies ({highRiskAlerts.length})
              </h4>
              <div className="notification-list">
                {highRiskAlerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="notification-card high-risk-card"
                    onClick={() => {
                      onSelectAlert(alert);
                      onClose();
                    }}
                  >
                    <div className="notification-card-top">
                      <span className="risk-badge high">Risk {alert.risk_score}</span>
                      <small>
                        {new Date(alert.created_at).toLocaleDateString()} &bull;{" "}
                        {new Date(alert.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </small>
                    </div>
                    <strong>{alert.sku_id} &ndash; {alert.product_name}</strong>
                    <p className="notification-reason">{alert.reason}</p>
                    <div className="notification-meta">
                      <span>{alert.store_name} ({alert.store_id})</span>
                      <span className="notification-rule-pill">{alert.rule_code}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="notification-section">
            <h4 className="section-title">Recent Detections ({alerts.length})</h4>
            {alerts.length === 0 ? (
              <div className="drawer-empty-state">
                <CheckCircle size={32} color="#36c995" />
                <p>No new alerts. All inventory counts within standard thresholds.</p>
              </div>
            ) : (
              <div className="notification-list">
                {alerts.map((alert) => (
                  <div
                    key={alert.alert_id}
                    className="notification-card"
                    onClick={() => {
                      onSelectAlert(alert);
                      onClose();
                    }}
                  >
                    <div className="notification-card-top">
                      <span className={`risk-badge ${alert.risk_score >= 70 ? "high" : alert.risk_score >= 40 ? "medium" : "low"}`}>
                        Risk {alert.risk_score}
                      </span>
                      <small>{new Date(alert.created_at).toLocaleDateString()}</small>
                    </div>
                    <strong>{alert.sku_id} &ndash; {alert.product_name}</strong>
                    <p className="notification-reason">{alert.reason}</p>
                    <div className="notification-meta">
                      <span>{alert.store_name} ({alert.store_id})</span>
                      <span className="notification-rule-pill">{alert.rule_code}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="drawer-footer">
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={() => {
              onClose();
              onViewAllAlerts();
            }}
          >
            Go to Full Alerts Management <ArrowRight size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
};

