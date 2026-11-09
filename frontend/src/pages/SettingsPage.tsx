import React, { useState, useMemo } from "react";
import {
  User,
  UserCheck,
  Bell,
  BellRing,
  ShieldAlert,
  AlertTriangle,
  Sliders,
  Monitor,
  Info,
  CheckCircle2,
  RotateCcw,
  Save,
  BookOpen,
  Clock,
  Sparkles,
  Building,
  Volume2,
  VolumeX,
  Calendar,
  Layers,
  ArrowRight,
} from "lucide-react";
import type {
  NavSection,
  UserProfileSettings,
  NotificationSettings,
  AlertRuleSettings,
  DisplayLayoutSettings,
} from "../types";
import {
  preferencesStorage,
  DEFAULT_USER_PROFILE,
  DEFAULT_NOTIFICATION_SETTINGS,
  DEFAULT_ALERT_SETTINGS,
  DEFAULT_DISPLAY_SETTINGS,
} from "../services/preferencesStorage";

interface SettingsPageProps {
  onShowToast: (
    type: "success" | "error" | "info" | "warning",
    title: string,
    message: string
  ) => void;
  onNavigate?: (section: NavSection) => void;
  userProfile?: UserProfileSettings;
  onUpdateProfile?: (profile: UserProfileSettings) => void;
  displayDensity?: "comfortable" | "compact";
  onUpdateDensity?: (density: "comfortable" | "compact") => void;
}

type SettingsTab = "ALL" | "PROFILE" | "NOTIFICATIONS" | "ALERTS" | "DISPLAY" | "ABOUT";

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onShowToast,
  onNavigate,
  userProfile: initialUserProfile,
  onUpdateProfile,
  displayDensity,
  onUpdateDensity,
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("ALL");

  // Section 1: User Profile State
  const [profile, setProfile] = useState<UserProfileSettings>(() => {
    return initialUserProfile || preferencesStorage.getUserProfile();
  });

  // Section 2: Notification Preferences State
  const [notifications, setNotifications] = useState<NotificationSettings>(() => {
    return preferencesStorage.getNotificationSettings();
  });

  // Section 3: Alert Preferences State
  const [alertSettings, setAlertSettings] = useState<AlertRuleSettings>(() => {
    return preferencesStorage.getAlertSettings();
  });

  // Section 4: Display Preferences State
  const [displaySettings, setDisplaySettings] = useState<DisplayLayoutSettings>(() => {
    const loaded = preferencesStorage.getDisplaySettings();
    if (displayDensity) {
      loaded.tableDensity = displayDensity;
    }
    return loaded;
  });

  // Formatted sample for Date/Time Preview
  const formattedSampleDate = useMemo(() => {
    const now = new Date();
    if (displaySettings.dateTimeFormat === "us") {
      return now.toLocaleString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    }
    if (displaySettings.dateTimeFormat === "international") {
      return now.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      });
    }
    // ISO format
    const iso = now.toISOString().replace("T", " ").substring(0, 19);
    return iso;
  }, [displaySettings.dateTimeFormat]);

  // Section Handlers
  const handleSaveProfile = () => {
    preferencesStorage.saveUserProfile(profile);
    if (onUpdateProfile) {
      onUpdateProfile(profile);
    }
    onShowToast(
      "success",
      "Profile Updated",
      `Operator identity saved for ${profile.name} (${profile.designation}).`
    );
  };

  const handleResetProfile = () => {
    setProfile(DEFAULT_USER_PROFILE);
    preferencesStorage.saveUserProfile(DEFAULT_USER_PROFILE);
    if (onUpdateProfile) {
      onUpdateProfile(DEFAULT_USER_PROFILE);
    }
    onShowToast("info", "Profile Reset", "User profile restored to system defaults.");
  };

  const handleSaveNotifications = () => {
    preferencesStorage.saveNotificationSettings(notifications);
    onShowToast(
      "success",
      "Notification Preferences Saved",
      "Workstation notification delivery rules updated."
    );
  };

  const handleResetNotifications = () => {
    setNotifications(DEFAULT_NOTIFICATION_SETTINGS);
    preferencesStorage.saveNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS);
    onShowToast("info", "Notifications Reset", "Notification preferences restored to defaults.");
  };

  const handleTestNotification = () => {
    onShowToast(
      "info",
      "Notification Test",
      "This is a preview of an in-app shrinkage alert notification."
    );
  };

  const handleSaveAlertSettings = () => {
    if (alertSettings.mediumRiskThreshold >= alertSettings.highRiskThreshold) {
      onShowToast(
        "error",
        "Invalid Thresholds",
        "Medium risk threshold must be lower than high risk threshold."
      );
      return;
    }
    preferencesStorage.saveAlertSettings(alertSettings);
    onShowToast(
      "success",
      "Alert Preferences Saved",
      "Risk classification thresholds and sort defaults updated."
    );
  };

  const handleResetAlertSettings = () => {
    setAlertSettings(DEFAULT_ALERT_SETTINGS);
    preferencesStorage.saveAlertSettings(DEFAULT_ALERT_SETTINGS);
    onShowToast("info", "Alert Rules Reset", "Risk thresholds restored to standard defaults (40 / 70).");
  };

  const handleSaveDisplaySettings = () => {
    preferencesStorage.saveDisplaySettings(displaySettings);
    if (onUpdateDensity) {
      onUpdateDensity(displaySettings.tableDensity);
    }
    onShowToast(
      "success",
      "Display Preferences Saved",
      `Applied ${displaySettings.tableDensity} density and ${displaySettings.dateTimeFormat.toUpperCase()} date format.`
    );
  };

  const handleResetDisplaySettings = () => {
    setDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    preferencesStorage.saveDisplaySettings(DEFAULT_DISPLAY_SETTINGS);
    if (onUpdateDensity) {
      onUpdateDensity(DEFAULT_DISPLAY_SETTINGS.tableDensity);
    }
    onShowToast("info", "Display Reset", "Display layout restored to comfortable default.");
  };

  const handleSaveAll = () => {
    preferencesStorage.saveUserProfile(profile);
    if (onUpdateProfile) onUpdateProfile(profile);

    preferencesStorage.saveNotificationSettings(notifications);
    preferencesStorage.saveAlertSettings(alertSettings);
    preferencesStorage.saveDisplaySettings(displaySettings);
    if (onUpdateDensity) onUpdateDensity(displaySettings.tableDensity);

    onShowToast(
      "success",
      "All Preferences Saved",
      "Your profile, notifications, alert thresholds, and layout preferences have been updated."
    );
  };

  return (
    <section className="dashboard-content">
      {/* Top Navigation & Action Header */}
      <div className="settings-top-bar">
        <div className="settings-nav-tabs">
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "ALL" ? "active" : ""}`}
            onClick={() => setActiveTab("ALL")}
          >
            <Sparkles size={16} /> All Settings
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "PROFILE" ? "active" : ""}`}
            onClick={() => setActiveTab("PROFILE")}
          >
            <User size={16} /> User Profile
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "NOTIFICATIONS" ? "active" : ""}`}
            onClick={() => setActiveTab("NOTIFICATIONS")}
          >
            <Bell size={16} /> Notifications
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "ALERTS" ? "active" : ""}`}
            onClick={() => setActiveTab("ALERTS")}
          >
            <ShieldAlert size={16} /> Alert Preferences
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "DISPLAY" ? "active" : ""}`}
            onClick={() => setActiveTab("DISPLAY")}
          >
            <Sliders size={16} /> Display & Layout
          </button>
          <button
            type="button"
            className={`settings-tab-btn ${activeTab === "ABOUT" ? "active" : ""}`}
            onClick={() => setActiveTab("ABOUT")}
          >
            <Info size={16} /> About Application
          </button>
        </div>

        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={handleSaveAll}
          title="Save all configuration sections"
        >
          <Save size={15} /> Save All Preferences
        </button>
      </div>

      <div className="settings-container">
        {/* ========================================================================= */}
        {/* 1. USER PROFILE SECTION */}
        {/* ========================================================================= */}
        {(activeTab === "ALL" || activeTab === "PROFILE") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon">
                  <UserCheck size={22} />
                </div>
                <div>
                  <h3>User Profile & Workstation Identity</h3>
                  <p>Manage your operator name, title, operational division, and local account preferences.</p>
                </div>
              </div>
            </div>

            <div className="settings-notice-pill">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Local Workstation Session:</strong> Profile settings are preserved in local browser storage for this workstation. Corporate Single Sign-On (SSO) and central role assignments are managed by enterprise directory services.
              </span>
            </div>

            <div className="settings-profile-layout">
              {/* Profile Avatar Card */}
              <div className="settings-profile-badge-card">
                <div className="settings-avatar-large">
                  {(profile.name || "U").charAt(0).toUpperCase()}
                </div>
                <h4>{profile.name || "Operator"}</h4>
                <span className="profile-role">{profile.designation || "Investigator"}</span>
                <span className="profile-tag">Active Session</span>
                <div style={{ marginTop: "14px", fontSize: "12px", color: "#64748b" }}>
                  Operator ID: <strong>{profile.operatorId || "OP-000001"}</strong>
                </div>
              </div>

              {/* Editable Fields Form */}
              <div className="settings-form-grid">
                <div className="settings-form-group">
                  <label htmlFor="user-name-input">
                    <User size={15} /> Full Name
                  </label>
                  <input
                    id="user-name-input"
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    placeholder="Enter full name"
                  />
                  <span className="form-hint">Displayed in application header and case audit notes</span>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="user-designation-input">
                    <Building size={15} /> Designation / Role
                  </label>
                  <input
                    id="user-designation-input"
                    type="text"
                    value={profile.designation}
                    onChange={(e) => setProfile({ ...profile, designation: e.target.value })}
                    placeholder="e.g. Investigation Lead"
                  />
                  <span className="form-hint">Your organizational role in loss prevention</span>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="user-department-input">
                    <Layers size={15} /> Department / Operations
                  </label>
                  <input
                    id="user-department-input"
                    type="text"
                    value={profile.department}
                    onChange={(e) => setProfile({ ...profile, department: e.target.value })}
                    placeholder="e.g. Loss Prevention & Inventory Control"
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="user-operator-id-input">
                    <Sparkles size={15} /> Operator Identifier
                  </label>
                  <input
                    id="user-operator-id-input"
                    type="text"
                    value={profile.operatorId}
                    onChange={(e) => setProfile({ ...profile, operatorId: e.target.value })}
                    placeholder="e.g. OP-00824"
                  />
                  <span className="form-hint">Workstation identifier attached to case actions</span>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="default-landing-select">
                    <Monitor size={15} /> Default Session Landing Page
                  </label>
                  <select
                    id="default-landing-select"
                    value={profile.defaultLanding}
                    onChange={(e) =>
                      setProfile({ ...profile, defaultLanding: e.target.value as NavSection })
                    }
                  >
                    <option value="dashboard">Dashboard (Overview & KPIs)</option>
                    <option value="alerts">Alerts (Shrinkage Feed)</option>
                    <option value="investigations">Investigations (Active Cases)</option>
                    <option value="analytics">Analytics (Loss Intelligence)</option>
                    <option value="stores">Stores (Facilities)</option>
                    <option value="skus">SKUs (Product Catalog)</option>
                    <option value="employees">Employees (Staff Roster)</option>
                  </select>
                  <span className="form-hint">Preferred workspace when launching application</span>
                </div>

                <div className="settings-form-group">
                  <label htmlFor="inactivity-lock-select">
                    <Clock size={15} /> Workstation Session Inactivity Lock
                  </label>
                  <select
                    id="inactivity-lock-select"
                    value={profile.inactivityLock}
                    onChange={(e) =>
                      setProfile({
                        ...profile,
                        inactivityLock: e.target.value as UserProfileSettings["inactivityLock"],
                      })
                    }
                  >
                    <option value="disabled">Disabled (Continuous Session)</option>
                    <option value="15min">15 Minutes of Inactivity</option>
                    <option value="30min">30 Minutes of Inactivity</option>
                    <option value="60min">60 Minutes of Inactivity</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetProfile}
              >
                <RotateCcw size={14} /> Reset Profile
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveProfile}
              >
                <Save size={14} /> Save Profile Changes
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. NOTIFICATION PREFERENCES SECTION */}
        {/* ========================================================================= */}
        {(activeTab === "ALL" || activeTab === "NOTIFICATIONS") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon">
                  <BellRing size={22} />
                </div>
                <div>
                  <h3>Notification Preferences</h3>
                  <p>Configure in-app alerts, high-risk banners, and assignment notices on this device.</p>
                </div>
              </div>
            </div>

            <div className="settings-notice-pill">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Workstation Alerts:</strong> Configures in-app toast notices and slide-over drawer badges on this client device. Central email or SMS dispatch gateways are managed by server infrastructure.
              </span>
            </div>

            <div className="settings-toggle-list">
              {/* New Shrinkage Alerts */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <AlertTriangle size={16} color="#6038df" />
                    <span>New Shrinkage Alerts</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Display in-app toast notifications whenever new physical cycle count shortages or unexpected discrepancies are loaded into the system.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.newAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, newAlerts: e.target.checked })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* High-Risk Alerts */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <ShieldAlert size={16} color="#ef4444" />
                    <span>High-Risk Alerts (Risk &ge; 70)</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Highlight urgent high-risk alerts with persistent notification banners and elevate priority badges in the notification drawer.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.highRiskAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, highRiskAlerts: e.target.checked })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Investigation Assignments */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <UserCheck size={16} color="#3b82f6" />
                    <span>Investigation Assignments</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Receive alert notices when an investigation case is newly delegated or reassigned to an investigator staff member.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.investigationAssignments}
                    onChange={(e) =>
                      setNotifications({
                        ...notifications,
                        investigationAssignments: e.target.checked,
                      })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Investigation Status Updates */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <CheckCircle2 size={16} color="#22c55e" />
                    <span>Investigation Status Updates</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Notify when an ongoing case transitions states (e.g. ASSIGNED, INVESTIGATING, RESOLVED, or ESCALATED).
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.statusUpdates}
                    onChange={(e) =>
                      setNotifications({ ...notifications, statusUpdates: e.target.checked })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              {/* Audible Notification Chime */}
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    {notifications.soundAlerts ? (
                      <Volume2 size={16} color="#6038df" />
                    ) : (
                      <VolumeX size={16} color="#94a3b8" />
                    )}
                    <span>Audible Notification Sound</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Play a subtle workstation audio chime when urgent alerts arrive.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={notifications.soundAlerts}
                    onChange={(e) =>
                      setNotifications({ ...notifications, soundAlerts: e.target.checked })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTestNotification}
                title="Send a sample notification banner"
              >
                <Bell size={14} /> Send Test In-App Notification
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetNotifications}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveNotifications}
              >
                <Save size={14} /> Save Notification Preferences
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. ALERT PREFERENCES SECTION */}
        {/* ========================================================================= */}
        {(activeTab === "ALL" || activeTab === "ALERTS") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon">
                  <ShieldAlert size={22} />
                </div>
                <div>
                  <h3>Alert Preferences & Risk Classification</h3>
                  <p>Customize risk score thresholds, alert display defaults, and investigation priority logic.</p>
                </div>
              </div>
            </div>

            <div className="settings-notice-pill">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Threshold Calibration:</strong> Risk score thresholds categorize incoming shrinkage records into Low, Medium, and High risk tiers for investigation workflow routing.
              </span>
            </div>

            {/* Threshold Sliders & Visual Spectrum */}
            <h4 style={{ margin: "16px 0 10px 0", fontSize: "14px", color: "#111a32" }}>
              Risk Level Thresholds
            </h4>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="high-risk-threshold-input">
                  High Risk Threshold (&ge; {alertSettings.highRiskThreshold})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    id="high-risk-threshold-input"
                    type="range"
                    min="50"
                    max="90"
                    step="1"
                    value={alertSettings.highRiskThreshold}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        highRiskThreshold: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                  <strong style={{ minWidth: "36px", color: "#ef4444", fontSize: "15px" }}>
                    {alertSettings.highRiskThreshold}
                  </strong>
                </div>
                <span className="form-hint">Scores at or above this value trigger urgent audit badges</span>
              </div>

              <div className="settings-form-group">
                <label htmlFor="med-risk-threshold-input">
                  Medium Risk Threshold (&ge; {alertSettings.mediumRiskThreshold})
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <input
                    id="med-risk-threshold-input"
                    type="range"
                    min="20"
                    max="50"
                    step="1"
                    value={alertSettings.mediumRiskThreshold}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        mediumRiskThreshold: Number(e.target.value),
                      })
                    }
                    style={{ flex: 1 }}
                  />
                  <strong style={{ minWidth: "36px", color: "#f59e0b", fontSize: "15px" }}>
                    {alertSettings.mediumRiskThreshold}
                  </strong>
                </div>
                <span className="form-hint">Scores between Medium and High thresholds are flagged for review</span>
              </div>
            </div>

            {/* Visual Risk Gauge */}
            <div className="settings-risk-gauge-container">
              <span style={{ fontSize: "12.5px", fontWeight: 600, color: "#475569" }}>
                Active Risk Classification Spectrum
              </span>
              <div className="settings-risk-gauge-bar">
                <div
                  className="risk-bar-low"
                  style={{ width: `${alertSettings.mediumRiskThreshold}%` }}
                  title={`Low Risk: 0 to ${alertSettings.mediumRiskThreshold - 1}`}
                />
                <div
                  className="risk-bar-medium"
                  style={{
                    width: `${alertSettings.highRiskThreshold - alertSettings.mediumRiskThreshold}%`,
                  }}
                  title={`Medium Risk: ${alertSettings.mediumRiskThreshold} to ${alertSettings.highRiskThreshold - 1}`}
                />
                <div
                  className="risk-bar-high"
                  style={{ width: `${100 - alertSettings.highRiskThreshold}%` }}
                  title={`High Risk: ${alertSettings.highRiskThreshold} to 100`}
                />
              </div>
              <div className="settings-risk-gauge-legend">
                <span>Low Risk: 0 &ndash; {alertSettings.mediumRiskThreshold - 1}</span>
                <span>
                  Medium Risk: {alertSettings.mediumRiskThreshold} &ndash;{" "}
                  {alertSettings.highRiskThreshold - 1}
                </span>
                <span>High Risk: {alertSettings.highRiskThreshold} &ndash; 100</span>
              </div>
            </div>

            {/* Alert Display & Investigation Priority Preferences */}
            <h4 style={{ margin: "24px 0 10px 0", fontSize: "14px", color: "#111a32" }}>
              Alert Display & Investigation Priority
            </h4>

            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="default-sort-select">
                  <Sliders size={15} /> Default Alerts Sort Order
                </label>
                <select
                  id="default-sort-select"
                  value={alertSettings.defaultSortOrder}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      defaultSortOrder: e.target.value as AlertRuleSettings["defaultSortOrder"],
                    })
                  }
                >
                  <option value="newest">Newest First (Creation Date)</option>
                  <option value="highest_risk">Highest Risk Score First</option>
                  <option value="store_id">Store Facility ID</option>
                  <option value="shortage">Shortage Quantity</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="default-risk-filter-select">
                  <ShieldAlert size={15} /> Default Risk Filter on Launch
                </label>
                <select
                  id="default-risk-filter-select"
                  value={alertSettings.defaultRiskFilter}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      defaultRiskFilter: e.target.value as AlertRuleSettings["defaultRiskFilter"],
                    })
                  }
                >
                  <option value="ALL">All Risk Levels</option>
                  <option value="HIGH">High Risk Only (&ge; {alertSettings.highRiskThreshold})</option>
                  <option value="MEDIUM_HIGH">Medium &amp; High Risk Only</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="default-inv-status-select">
                  <CheckCircle2 size={15} /> Investigation Workspace Default Filter
                </label>
                <select
                  id="default-inv-status-select"
                  value={alertSettings.defaultInvestigationStatus}
                  onChange={(e) =>
                    setAlertSettings({
                      ...alertSettings,
                      defaultInvestigationStatus: e.target
                        .value as AlertRuleSettings["defaultInvestigationStatus"],
                    })
                  }
                >
                  <option value="ACTIVE">All Active Cases (OPEN &amp; INVESTIGATING)</option>
                  <option value="ALL">All Cases (Including RESOLVED &amp; ESCALATED)</option>
                  <option value="OPEN">Unassigned / OPEN Cases Only</option>
                </select>
              </div>
            </div>

            <div className="settings-toggle-list" style={{ marginTop: "14px" }}>
              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <span>Auto-Flag High Risk Investigations</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Automatically mark new investigations created from High Risk alerts (&ge; {alertSettings.highRiskThreshold}) with Urgent Priority tags.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={alertSettings.autoFlagHighPriority}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        autoFlagHighPriority: e.target.checked,
                      })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>

              <div className="settings-toggle-item">
                <div className="settings-toggle-text">
                  <div className="settings-toggle-title">
                    <span>Enforce Case Resolution Audit Notes</span>
                  </div>
                  <p className="settings-toggle-desc">
                    Require investigators to enter an audit note explaining findings and loss recovery outcomes before concluding a case as RESOLVED.
                  </p>
                </div>
                <label className="settings-switch">
                  <input
                    type="checkbox"
                    checked={alertSettings.requireResolutionNotes}
                    onChange={(e) =>
                      setAlertSettings({
                        ...alertSettings,
                        requireResolutionNotes: e.target.checked,
                      })
                    }
                  />
                  <span className="settings-slider"></span>
                </label>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetAlertSettings}
              >
                <RotateCcw size={14} /> Reset Thresholds
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveAlertSettings}
              >
                <Save size={14} /> Save Alert Preferences
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. DISPLAY PREFERENCES SECTION */}
        {/* ========================================================================= */}
        {(activeTab === "ALL" || activeTab === "DISPLAY") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon">
                  <Monitor size={22} />
                </div>
                <div>
                  <h3>Display &amp; Layout Preferences</h3>
                  <p>Customize date/time formatting, table row density, and dashboard visual presentation.</p>
                </div>
              </div>
            </div>

            <div className="settings-notice-pill">
              <Info size={16} style={{ flexShrink: 0 }} />
              <span>
                <strong>Workstation Layout:</strong> Display preferences apply immediately to this browser workstation and do not alter underlying database timestamps or records.
              </span>
            </div>

            {/* Date and Time Format */}
            <div className="settings-form-grid">
              <div className="settings-form-group">
                <label htmlFor="date-format-select">
                  <Calendar size={15} /> Date &amp; Time Format
                </label>
                <select
                  id="date-format-select"
                  value={displaySettings.dateTimeFormat}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      dateTimeFormat: e.target.value as DisplayLayoutSettings["dateTimeFormat"],
                    })
                  }
                >
                  <option value="iso">YYYY-MM-DD HH:mm:ss (Standard ISO)</option>
                  <option value="us">MM/DD/YYYY, hh:mm A (US Format)</option>
                  <option value="international">DD/MM/YYYY, HH:mm (International Format)</option>
                </select>
                <span className="form-hint">
                  Live Preview: <strong>{formattedSampleDate}</strong>
                </span>
              </div>

              <div className="settings-form-group">
                <label htmlFor="chart-visual-select">
                  <Sliders size={15} /> Dashboard Chart Visual Style
                </label>
                <select
                  id="chart-visual-select"
                  value={displaySettings.chartVisual}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      chartVisual: e.target.value as DisplayLayoutSettings["chartVisual"],
                    })
                  }
                >
                  <option value="spline">Smooth Curved Area (Spline)</option>
                  <option value="linear">Linear Stepped Points</option>
                  <option value="bar">Bar Histogram</option>
                </select>
                <span className="form-hint">Rendering mode for the 7-day shrinkage trend chart</span>
              </div>

              <div className="settings-form-group">
                <label htmlFor="recent-alerts-limit-select">
                  <Layers size={15} /> Dashboard Recent Alerts Limit
                </label>
                <select
                  id="recent-alerts-limit-select"
                  value={displaySettings.recentAlertsLimit}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      recentAlertsLimit: Number(e.target.value),
                    })
                  }
                >
                  <option value={5}>5 Records</option>
                  <option value={10}>10 Records (Recommended)</option>
                  <option value={15}>15 Records</option>
                </select>
              </div>

              <div className="settings-form-group">
                <label htmlFor="refresh-interval-select">
                  <Clock size={15} /> Auto-Refresh Interval
                </label>
                <select
                  id="refresh-interval-select"
                  value={displaySettings.refreshIntervalSeconds}
                  disabled={!displaySettings.autoRefresh}
                  onChange={(e) =>
                    setDisplaySettings({
                      ...displaySettings,
                      refreshIntervalSeconds: Number(e.target.value),
                    })
                  }
                >
                  <option value={30}>Every 30 Seconds</option>
                  <option value={60}>Every 60 Seconds (1 Minute)</option>
                  <option value={300}>Every 5 Minutes</option>
                </select>
                <span className="form-hint">Active when dashboard background polling is enabled</span>
              </div>
            </div>

            {/* Table Display Density Cards */}
            <div style={{ marginTop: "20px" }}>
              <label style={{ fontSize: "13px", fontWeight: 600, color: "#334155", display: "block" }}>
                Table Display Density
              </label>
              <div className="settings-density-cards">
                <div
                  className={`settings-density-card ${
                    displaySettings.tableDensity === "comfortable" ? "selected" : ""
                  }`}
                  onClick={() =>
                    setDisplaySettings({ ...displaySettings, tableDensity: "comfortable" })
                  }
                >
                  <div className="density-card-header">
                    <span>Comfortable Density</span>
                    {displaySettings.tableDensity === "comfortable" && (
                      <CheckCircle2 size={16} color="#6038df" />
                    )}
                  </div>
                  <span className="density-card-desc">
                    Generous row padding (14px) and spacing. Best for general readability and touchscreens.
                  </span>
                </div>

                <div
                  className={`settings-density-card ${
                    displaySettings.tableDensity === "compact" ? "selected" : ""
                  }`}
                  onClick={() =>
                    setDisplaySettings({ ...displaySettings, tableDensity: "compact" })
                  }
                >
                  <div className="density-card-header">
                    <span>Compact Density</span>
                    {displaySettings.tableDensity === "compact" && (
                      <CheckCircle2 size={16} color="#6038df" />
                    )}
                  </div>
                  <span className="density-card-desc">
                    Tight row padding (8px) and condensed typography. Maximizes records visible per screen.
                  </span>
                </div>
              </div>
            </div>

            <div className="settings-card-actions">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleResetDisplaySettings}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleSaveDisplaySettings}
              >
                <Save size={14} /> Save Display Preferences
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. ABOUT APPLICATION SECTION */}
        {/* ========================================================================= */}
        {(activeTab === "ALL" || activeTab === "ABOUT") && (
          <div className="settings-card">
            <div className="settings-card-header">
              <div className="settings-card-title-group">
                <div className="settings-card-icon">
                  <Info size={22} />
                </div>
                <div>
                  <h3>About Application &amp; System Identity</h3>
                  <p>Application release details, platform specifications, and operational support contacts.</p>
                </div>
              </div>
            </div>

            {/* Application Hero Card */}
            <div className="settings-about-hero">
              <div className="settings-about-logo">
                <Sparkles size={28} />
              </div>
              <div className="settings-about-hero-details">
                <h3>
                  Smart Inventory Loss Detection &amp; Investigation System
                  <span className="version-badge">v1.0.0 Production</span>
                </h3>
                <p>
                  An enterprise intelligence and audit platform engineered to detect inventory shrinkage, monitor unexplained stock variances, identify repeated adjustment patterns, trace transit discrepancies, and conduct end-to-end forensic loss investigations across retail facilities and distribution hubs.
                </p>
              </div>
            </div>

            {/* Specifications Grid */}
            <div className="settings-specs-grid">
              <div className="settings-spec-item">
                <span>Application Name</span>
                <strong>Smart Inventory Loss Detection &amp; Investigation System</strong>
              </div>
              <div className="settings-spec-item">
                <span>Release Version</span>
                <strong>v1.0.0 (Production Release)</strong>
              </div>
              <div className="settings-spec-item">
                <span>Build Date</span>
                <strong>November 2026</strong>
              </div>
              <div className="settings-spec-item">
                <span>Operational Role</span>
                <strong>Forensic Loss Investigation Console</strong>
              </div>
              <div className="settings-spec-item">
                <span>Database Integration</span>
                <strong>MySQL Database (inventory_loss_db)</strong>
              </div>
              <div className="settings-spec-item">
                <span>Audit Trail Standard</span>
                <strong>Immutable History Trail (investigation_history)</strong>
              </div>
            </div>

            {/* Help & Support Info Box */}
            <div className="settings-support-box">
              <div className="settings-support-details">
                <strong>Loss Prevention Operations Helpdesk</strong>
                <span>
                  For system assistance, investigator account provisioning, or operational escalations:{" "}
                  <code>support@inventory-loss.internal</code> &bull; Internal Hotline: <strong>Ext. #4401</strong>
                </span>
                <span style={{ fontSize: "11.5px", color: "#94a3b8", marginTop: "2px" }}>
                  Operational Hours: Monday &ndash; Friday, 08:00 &ndash; 18:00 Local Facility Time
                </span>
              </div>

              {onNavigate && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => onNavigate("help")}
                  title="Navigate to documentation and user manual"
                >
                  <BookOpen size={14} /> Open Documentation &amp; Guides <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
