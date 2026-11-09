import React from "react";
import {
  LayoutDashboard,
  Bell,
  Search,
  BarChart3,
  Store,
  Boxes,
  Users,
  Settings,
  HelpCircle,
} from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import type { NavSection } from "../types";

interface SidebarProps {
  currentSection: NavSection;
  onNavigate: (section: NavSection) => void;
  totalAlerts?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onNavigate,
  totalAlerts,
}) => {
  const mainNavigation = [
    { id: "dashboard" as NavSection, name: "Dashboard", icon: LayoutDashboard },
    { id: "alerts" as NavSection, name: "Alerts", icon: Bell },
    { id: "investigations" as NavSection, name: "Investigations", icon: Search },
    { id: "analytics" as NavSection, name: "Analytics", icon: BarChart3 },
    { id: "stores" as NavSection, name: "Stores", icon: Store },
    { id: "skus" as NavSection, name: "SKUs", icon: Boxes },
    { id: "employees" as NavSection, name: "Employees", icon: Users },
  ];

  return (
    <aside className="sidebar" aria-label="Main Navigation">
      {/* Redesigned Compact & Neat Brand Header */}
      <div className="brand">
        <BrandLogo size={34} variant="dark" />
      </div>

      <nav className="navigation" aria-label="Primary Workspaces">
        <div className="nav-section-label">WORKSPACES</div>
        {mainNavigation.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon size={19} className="nav-icon" />
              <span className="nav-label">{item.name}</span>
              {item.id === "alerts" && typeof totalAlerts === "number" && totalAlerts > 0 && (
                <span className="nav-badge" title={`${totalAlerts} total alerts in system`}>
                  {totalAlerts}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        <div className="nav-section-label">SYSTEM</div>
        <button
          className={`nav-item ${currentSection === "settings" ? "active" : ""}`}
          type="button"
          onClick={() => onNavigate("settings")}
          aria-current={currentSection === "settings" ? "page" : undefined}
        >
          <Settings size={19} className="nav-icon" />
          <span className="nav-label">Settings</span>
        </button>
        <button
          className={`nav-item ${currentSection === "help" ? "active" : ""}`}
          type="button"
          onClick={() => onNavigate("help")}
          aria-current={currentSection === "help" ? "page" : undefined}
        >
          <HelpCircle size={19} className="nav-icon" />
          <span className="nav-label">Help</span>
        </button>
      </div>
    </aside>
  );
};
