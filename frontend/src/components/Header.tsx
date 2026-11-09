import React, { useState, useRef, useEffect } from "react";
import { Search, Bell, ChevronDown, AlertTriangle, Box, Store, FileText, X, Users } from "lucide-react";
import { DATABASE_EMPLOYEES } from "../data/databaseEmployees";
import type {
  NavSection,
  RecentAlert,
  Investigation,
  DerivedStore,
  DerivedSKU,
} from "../types";

interface HeaderProps {
  currentSection: NavSection;
  alerts: RecentAlert[];
  investigations: Investigation[];
  stores: DerivedStore[];
  skus: DerivedSKU[];
  unreadAlertsCount: number;
  onOpenNotifications: () => void;
  onSelectAlert: (alert: RecentAlert) => void;
  onSelectInvestigation: (investigation: Investigation) => void;
  onNavigate: (section: NavSection) => void;
  userProfile?: { name: string; designation: string };
}

export const Header: React.FC<HeaderProps> = ({
  currentSection,
  alerts,
  investigations,
  stores,
  skus,
  unreadAlertsCount,
  onOpenNotifications,
  onSelectAlert,
  onSelectInvestigation,
  onNavigate,
  userProfile,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Close search dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const titles: Record<NavSection, { title: string; subtitle: string }> = {
    dashboard: {
      title: "Dashboard",
      subtitle: "Real-time inventory loss detection and investigation management",
    },
    alerts: {
      title: "Alert Management",
      subtitle: "Monitor, search, and triage real-time shrinkage alerts from MySQL",
    },
    investigations: {
      title: "Investigation Management",
      subtitle: "Track, assign, investigate, and audit inventory loss cases",
    },
    analytics: {
      title: "Analytics & Loss Intelligence",
      subtitle: "Comprehensive shrinkage trends, store benchmarks, and anomaly metrics",
    },
    stores: {
      title: "Monitored Stores",
      subtitle: "Store facilities, loss patterns, and investigation status",
    },
    skus: {
      title: "Tracked SKUs",
      subtitle: "Inventory catalog loss risk, shortage metrics, and alerts",
    },
    employees: {
      title: "Investigation Staff & Audit Activity",
      subtitle: "Assigned investigators, auditors, and case activity",
    },
    settings: {
      title: "Application Settings",
      subtitle: "User profile, notifications, alert rules, and display preferences",
    },
    help: {
      title: "Help & Documentation",
      subtitle: "Operational guides, detection formulas, and investigation workflow",
    },
  };

  const currentMeta = titles[currentSection] || titles.dashboard;

  // Filter items matching query
  const trimmed = searchQuery.trim().toLowerCase();
  const matchedAlerts = trimmed
    ? alerts
        .filter(
          (a) =>
            a.alert_id.toLowerCase().includes(trimmed) ||
            a.store_id.toLowerCase().includes(trimmed) ||
            a.store_name.toLowerCase().includes(trimmed) ||
            a.sku_id.toLowerCase().includes(trimmed) ||
            a.product_name.toLowerCase().includes(trimmed) ||
            a.reason.toLowerCase().includes(trimmed)
        )
        .slice(0, 4)
    : [];

  const matchedInvestigations = trimmed
    ? investigations
        .filter(
          (i) =>
            i.investigation_id.toLowerCase().includes(trimmed) ||
            i.alert_id.toLowerCase().includes(trimmed) ||
            i.store_id.toLowerCase().includes(trimmed) ||
            i.sku_id.toLowerCase().includes(trimmed) ||
            (i.assigned_to && i.assigned_to.toLowerCase().includes(trimmed))
        )
        .slice(0, 4)
    : [];

  const matchedStores = trimmed
    ? stores
        .filter(
          (s) =>
            s.store_id.toLowerCase().includes(trimmed) ||
            (s.store_name && s.store_name.toLowerCase().includes(trimmed))
        )
        .slice(0, 3)
    : [];

  const matchedSkus = trimmed
    ? skus
        .filter(
          (k) =>
            k.sku_id.toLowerCase().includes(trimmed) ||
            k.product_name.toLowerCase().includes(trimmed)
        )
        .slice(0, 3)
    : [];

  const matchedEmployees = trimmed
    ? DATABASE_EMPLOYEES.filter(
        (e) =>
          e.employee_id.toLowerCase().includes(trimmed) ||
          e.employee_name.toLowerCase().includes(trimmed) ||
          e.role.toLowerCase().includes(trimmed)
      ).slice(0, 3)
    : [];

  const hasResults =
    matchedAlerts.length > 0 ||
    matchedInvestigations.length > 0 ||
    matchedStores.length > 0 ||
    matchedSkus.length > 0 ||
    matchedEmployees.length > 0;

  return (
    <header className="top-header">
      <div className="page-heading">
        <h1>{currentMeta.title}</h1>
        <p>{currentMeta.subtitle}</p>
      </div>

      <div className="header-actions">
        <div className="search-box-wrapper" ref={searchRef}>
          <div className="search-box">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search stores, SKUs, alerts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => {
                if (searchQuery.trim()) setIsSearchOpen(true);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          {isSearchOpen && searchQuery.trim() && (
            <div className="search-dropdown-results">
              {!hasResults && (
                <div className="search-empty">
                  No matching stores, SKUs, or alerts found for &ldquo;{searchQuery}&rdquo;.
                </div>
              )}

              {matchedAlerts.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header">
                    <AlertTriangle size={14} /> Alerts ({matchedAlerts.length})
                  </div>
                  {matchedAlerts.map((alert) => (
                    <div
                      key={alert.alert_id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectAlert(alert);
                        onNavigate("alerts");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="search-result-title">
                        <strong>{alert.alert_id}</strong>
                        <span className={`risk-badge ${alert.risk_score >= 70 ? "high" : alert.risk_score >= 40 ? "medium" : "low"}`}>
                          Risk {alert.risk_score}
                        </span>
                      </div>
                      <small>
                        {alert.store_name} ({alert.store_id}) &bull; {alert.product_name}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {matchedInvestigations.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header">
                    <FileText size={14} /> Investigations ({matchedInvestigations.length})
                  </div>
                  {matchedInvestigations.map((inv) => (
                    <div
                      key={inv.investigation_id}
                      className="search-result-item"
                      onClick={() => {
                        onSelectInvestigation(inv);
                        onNavigate("investigations");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="search-result-title">
                        <strong>{inv.investigation_id}</strong>
                        <span className="status-pill">{inv.status}</span>
                      </div>
                      <small>
                        Alert: {inv.alert_id} &bull; Store: {inv.store_id} &bull; SKU: {inv.sku_id}
                      </small>
                    </div>
                  ))}
                </div>
              )}

              {matchedStores.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header">
                    <Store size={14} /> Stores ({matchedStores.length})
                  </div>
                  {matchedStores.map((store) => (
                    <div
                      key={store.store_id}
                      className="search-result-item"
                      onClick={() => {
                        onNavigate("stores");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="search-result-title">
                        <strong>{store.store_name || store.store_id}</strong>
                        <span>{store.store_id}</span>
                      </div>
                      <small>{store.alert_count} active alert(s)</small>
                    </div>
                  ))}
                </div>
              )}

              {matchedSkus.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header">
                    <Box size={14} /> SKUs ({matchedSkus.length})
                  </div>
                  {matchedSkus.map((sku) => (
                    <div
                      key={sku.sku_id}
                      className="search-result-item"
                      onClick={() => {
                        onNavigate("skus");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="search-result-title">
                        <strong>{sku.product_name}</strong>
                        <span>{sku.sku_id}</span>
                      </div>
                      <small>{sku.alert_count} alert(s)</small>
                    </div>
                  ))}
                </div>
              )}

              {matchedEmployees.length > 0 && (
                <div className="search-category-group">
                  <div className="search-category-header">
                    <Users size={14} /> Employees ({matchedEmployees.length})
                  </div>
                  {matchedEmployees.map((emp) => (
                    <div
                      key={emp.employee_id}
                      className="search-result-item"
                      onClick={() => {
                        onNavigate("employees");
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <div className="search-result-title">
                        <strong>{emp.employee_name}</strong>
                        <span>{emp.employee_id}</span>
                      </div>
                      <small>{emp.role} &bull; {emp.store_id}</small>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          className="notification-button"
          type="button"
          onClick={onOpenNotifications}
          title="View recent alerts and notices"
          aria-label="View notifications"
        >
          <Bell size={23} />
          {unreadAlertsCount > 0 && (
            <span className="notification-counter-badge">{unreadAlertsCount}</span>
          )}
        </button>

        <div
          className="profile"
          onClick={() => onNavigate("settings")}
          style={{ cursor: "pointer" }}
          title="Open Application Settings"
        >
          <div className="profile-avatar">
            {(userProfile?.name || "P").charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>{userProfile?.name || "Pavan"}</strong>
            <small>{userProfile?.designation || "Investigation Lead"}</small>
          </div>
          <ChevronDown size={18} />
        </div>
      </div>
    </header>
  );
};

