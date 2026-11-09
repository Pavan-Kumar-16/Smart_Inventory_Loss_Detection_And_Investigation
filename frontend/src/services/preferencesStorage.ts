import type {
  UserProfileSettings,
  NotificationSettings,
  AlertRuleSettings,
  DisplayLayoutSettings,
} from "../types";

export const DEFAULT_USER_PROFILE: UserProfileSettings = {
  name: "Pavan",
  designation: "Investigation Lead",
  department: "Loss Prevention & Inventory Control",
  operatorId: "OP-00824",
  defaultLanding: "dashboard",
  inactivityLock: "disabled",
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  newAlerts: true,
  highRiskAlerts: true,
  investigationAssignments: true,
  statusUpdates: true,
  soundAlerts: false,
};

export const DEFAULT_ALERT_SETTINGS: AlertRuleSettings = {
  highRiskThreshold: 70,
  mediumRiskThreshold: 40,
  defaultSortOrder: "newest",
  defaultRiskFilter: "ALL",
  autoOpenAlerts: true,
  autoFlagHighPriority: true,
  defaultInvestigationStatus: "ACTIVE",
  requireResolutionNotes: true,
};

export const DEFAULT_DISPLAY_SETTINGS: DisplayLayoutSettings = {
  dateTimeFormat: "iso",
  tableDensity: "comfortable",
  chartVisual: "spline",
  recentAlertsLimit: 10,
  autoRefresh: false,
  refreshIntervalSeconds: 60,
};

const STORAGE_KEYS = {
  USER_PROFILE: "inventory_user_profile",
  NOTIFICATIONS: "inventory_notification_prefs",
  ALERTS: "inventory_alert_prefs",
  DISPLAY: "inventory_display_prefs",
};

export const preferencesStorage = {
  getUserProfile(): UserProfileSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (saved) return { ...DEFAULT_USER_PROFILE, ...JSON.parse(saved) };
    } catch {
      // Fallback to default
    }
    return DEFAULT_USER_PROFILE;
  },

  saveUserProfile(profile: UserProfileSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch {
      // Ignore write errors
    }
  },

  getNotificationSettings(): NotificationSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (saved) return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback to default
    }
    return DEFAULT_NOTIFICATION_SETTINGS;
  },

  saveNotificationSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
    } catch {
      // Ignore write errors
    }
  },

  getAlertSettings(): AlertRuleSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
      if (saved) return { ...DEFAULT_ALERT_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback to default
    }
    return DEFAULT_ALERT_SETTINGS;
  },

  saveAlertSettings(settings: AlertRuleSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(settings));
    } catch {
      // Ignore write errors
    }
  },

  getDisplaySettings(): DisplayLayoutSettings {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DISPLAY);
      if (saved) return { ...DEFAULT_DISPLAY_SETTINGS, ...JSON.parse(saved) };
    } catch {
      // Fallback to default
    }
    return DEFAULT_DISPLAY_SETTINGS;
  },

  saveDisplaySettings(settings: DisplayLayoutSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.DISPLAY, JSON.stringify(settings));
    } catch {
      // Ignore write errors
    }
  },
};

