import React, { useState, useMemo } from "react";
import {
  Search,
  Users,
  UserCheck,
  FileText,
  X,
  RotateCw,
  Store,
  Filter,
  ArrowUpDown,
  History,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from "lucide-react";
import type { DerivedEmployee, Investigation, InvestigationHistory } from "../types";
import { DATABASE_EMPLOYEES } from "../data/databaseEmployees";

interface EmployeesPageProps {
  investigations: Investigation[];
  investigationHistories: InvestigationHistory[];
  loading: boolean;
  onRefresh: () => Promise<void>;
  onSelectInvestigation: (investigation: Investigation) => void;
}

export const EmployeesPage: React.FC<EmployeesPageProps> = ({
  investigations,
  investigationHistories,
  loading,
  onRefresh,
  onSelectInvestigation,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [storeFilter, setStoreFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState<"id" | "cases" | "audits">("id");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [selectedEmployee, setSelectedEmployee] = useState<DerivedEmployee | null>(null);

  // Derive all 30 employees merging master database records with live API investigations and audit history
  const allEmployees: DerivedEmployee[] = useMemo(() => {
    return DATABASE_EMPLOYEES.map((masterEmp) => {
      // Find all investigations assigned to this employee
      const assignedCases = investigations.filter(
        (inv) => inv.assigned_to === masterEmp.employee_id
      );
      const assigned_cases_count = assignedCases.length;
      const active_cases_count = assignedCases.filter(
        (inv) => inv.status !== "RESOLVED"
      ).length;
      const resolved_cases_count = assignedCases.filter(
        (inv) => inv.status === "RESOLVED"
      ).length;

      // Find all audit history records where this employee made a change
      const employeeAuditActions = investigationHistories.filter(
        (h) => h.changed_by === masterEmp.employee_id
      );
      const audit_actions_count = employeeAuditActions.length;

      // Determine latest action if any
      let last_action: string | undefined;
      let last_action_date: string | undefined;
      if (employeeAuditActions.length > 0) {
        const sortedAudits = [...employeeAuditActions].sort(
          (a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime()
        );
        last_action = sortedAudits[0].notes || `Status transition to ${sortedAudits[0].new_status}`;
        last_action_date = sortedAudits[0].changed_at;
      } else if (assignedCases.length > 0) {
        last_action = `Assigned case ${assignedCases[0].investigation_id}`;
        last_action_date = assignedCases[0].opened_at;
      }

      return {
        employee_id: masterEmp.employee_id,
        name: masterEmp.employee_name,
        role: masterEmp.role,
        store_id: masterEmp.store_id,
        status: masterEmp.status,
        assigned_cases_count,
        active_cases_count,
        resolved_cases_count,
        audit_actions_count,
        last_action,
        last_action_date,
      };
    });
  }, [investigations, investigationHistories]);

  // Overall KPI metrics
  const totalStaff = allEmployees.length;
  const staffWithCases = allEmployees.filter((e) => e.assigned_cases_count > 0).length;
  const totalActiveCases = allEmployees.reduce((sum, e) => sum + e.active_cases_count, 0);
  const totalAuditActions = allEmployees.reduce((sum, e) => sum + e.audit_actions_count, 0);

  // Unique roles for filter dropdown
  const uniqueRoles = useMemo(() => {
    const roles = new Set<string>();
    DATABASE_EMPLOYEES.forEach((e) => roles.add(e.role));
    return Array.from(roles);
  }, []);

  // Unique stores for filter dropdown
  const uniqueStores = useMemo(() => {
    const stores = new Set<string>();
    DATABASE_EMPLOYEES.forEach((e) => stores.add(e.store_id));
    return Array.from(stores).sort();
  }, []);

  // Filtered and sorted employees
  const filteredEmployees = useMemo(() => {
    return allEmployees
      .filter((emp) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const match =
            emp.employee_id.toLowerCase().includes(q) ||
            emp.name.toLowerCase().includes(q) ||
            emp.role.toLowerCase().includes(q) ||
            emp.store_id.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Role filter
        if (roleFilter !== "ALL" && emp.role !== roleFilter) {
          return false;
        }

        // Store filter
        if (storeFilter !== "ALL" && emp.store_id !== storeFilter) {
          return false;
        }

        // Activity filter
        if (activityFilter === "WITH_CASES" && emp.assigned_cases_count === 0) {
          return false;
        }
        if (activityFilter === "ACTIVE_CASES" && emp.active_cases_count === 0) {
          return false;
        }
        if (activityFilter === "RESOLVED_CASES" && emp.resolved_cases_count === 0) {
          return false;
        }
        if (activityFilter === "WITH_AUDITS" && emp.audit_actions_count === 0) {
          return false;
        }
        if (
          activityFilter === "ZERO_ACTIVITY" &&
          (emp.assigned_cases_count > 0 || emp.audit_actions_count > 0)
        ) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let diff: number;
        if (sortBy === "cases") {
          diff = a.assigned_cases_count - b.assigned_cases_count;
        } else if (sortBy === "audits") {
          diff = a.audit_actions_count - b.audit_actions_count;
        } else {
          diff = a.employee_id.localeCompare(b.employee_id);
        }
        return sortOrder === "asc" ? diff : -diff;
      });
  }, [allEmployees, searchQuery, roleFilter, storeFilter, activityFilter, sortBy, sortOrder]);

  // Selected employee investigations and audit logs
  const employeeCases = useMemo(() => {
    if (!selectedEmployee) return [];
    return investigations.filter(
      (i) => i.assigned_to === selectedEmployee.employee_id
    );
  }, [investigations, selectedEmployee]);

  const employeeAudits = useMemo(() => {
    if (!selectedEmployee) return [];
    return investigationHistories
      .filter((h) => h.changed_by === selectedEmployee.employee_id)
      .sort((a, b) => new Date(b.changed_at).getTime() - new Date(a.changed_at).getTime());
  }, [investigationHistories, selectedEmployee]);

  return (
    <section className="dashboard-content">
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card blue-card">
          <div className="kpi-icon blue-icon">
            <Users size={30} />
          </div>
          <div className="kpi-details">
            <span>Total Staff Monitored</span>
            <strong>{totalStaff}</strong>
            <small>Employees registered in MySQL</small>
          </div>
        </div>

        <div className="kpi-card purple-card">
          <div className="kpi-icon purple-icon">
            <UserCheck size={30} />
          </div>
          <div className="kpi-details">
            <span>Assigned Investigators</span>
            <strong>{staffWithCases}</strong>
            <small>With case portfolio</small>
          </div>
        </div>

        <div className="kpi-card red-card">
          <div className="kpi-icon red-icon">
            <ShieldAlert size={30} />
          </div>
          <div className="kpi-details">
            <span>Active Open Cases</span>
            <strong>{totalActiveCases}</strong>
            <small>Under active triage</small>
          </div>
        </div>

        <div className="kpi-card green-card">
          <div className="kpi-icon green-icon">
            <History size={30} />
          </div>
          <div className="kpi-details">
            <span>Total Audit Actions</span>
            <strong>{totalAuditActions}</strong>
            <small>Recorded in investigation_history</small>
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
              placeholder="Search by ID (EMP-000001), Name (Employee 001), Role, or Store..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="filter-selects-group">
            <label className="filter-label">
              <Filter size={15} /> Role:
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="ALL">All Roles</option>
                {uniqueRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-label">
              <Store size={15} /> Store:
              <select
                value={storeFilter}
                onChange={(e) => setStoreFilter(e.target.value)}
              >
                <option value="ALL">All Stores</option>
                {uniqueStores.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>

            <label className="filter-label">
              Activity:
              <select
                value={activityFilter}
                onChange={(e) => setActivityFilter(e.target.value)}
              >
                <option value="ALL">All Employees ({allEmployees.length})</option>
                <option value="WITH_CASES">With Assigned Cases ({staffWithCases})</option>
                <option value="WITH_AUDITS">With Audit Actions ({allEmployees.filter((e) => e.audit_actions_count > 0).length})</option>
                <option value="ZERO_ACTIVITY">Zero Activity ({allEmployees.filter((e) => e.assigned_cases_count === 0 && e.audit_actions_count === 0).length})</option>
              </select>
            </label>

            <label className="filter-label">
              <ArrowUpDown size={15} /> Sort:
              <select
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [by, order] = e.target.value.split("-") as [
                    "id" | "cases" | "audits",
                    "asc" | "desc"
                  ];
                  setSortBy(by);
                  setSortOrder(order);
                }}
              >
                <option value="id-asc">Employee ID (EMP-001...)</option>
                <option value="id-desc">Employee ID (Reverse)</option>
                <option value="cases-desc">Assigned Cases (Highest)</option>
                <option value="audits-desc">Audit Actions (Highest)</option>
              </select>
            </label>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onRefresh}
              disabled={loading}
              title="Refresh employee activity from database"
            >
              <RotateCw size={15} /> Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="panel alerts-panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <Users size={20} color="#6038df" />
            <h2>Database Employees & Investigation Portfolio</h2>
            <span className="results-count-badge">
              Showing {filteredEmployees.length} of {allEmployees.length} employees
            </span>
          </div>
          <span className="panel-subtitle">Click row to review complete profile & audit trail</span>
        </div>

        <div className="table-wrapper">
          <table className="alerts-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Employee Name</th>
                <th>Designation / Role</th>
                <th>Assigned Store</th>
                <th>Assigned Cases</th>
                <th>Active Cases</th>
                <th>Resolved Cases</th>
                <th>Audit Actions</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.map((emp) => (
                <tr
                  key={emp.employee_id}
                  onClick={() => setSelectedEmployee(emp)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <strong>{emp.employee_id}</strong>
                  </td>
                  <td>
                    <strong>{emp.name}</strong>
                  </td>
                  <td>
                    <span>{emp.role}</span>
                  </td>
                  <td>
                    <span>{emp.store_id}</span>
                  </td>
                  <td>
                    <span
                      className={`badge-count ${
                        emp.assigned_cases_count > 0 ? "text-purple" : ""
                      }`}
                    >
                      {emp.assigned_cases_count}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-count ${
                        emp.active_cases_count > 0 ? "text-amber" : ""
                      }`}
                    >
                      {emp.active_cases_count}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-count ${
                        emp.resolved_cases_count > 0 ? "text-green" : ""
                      }`}
                    >
                      {emp.resolved_cases_count}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge-count ${
                        emp.audit_actions_count > 0 ? "text-blue" : ""
                      }`}
                    >
                      {emp.audit_actions_count}
                    </span>
                  </td>
                  <td>
                    <span className="status-pill status-resolved">
                      {emp.status}
                    </span>
                  </td>
                </tr>
              ))}

              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={9} className="empty-state">
                    <Users size={32} color="#929bb2" style={{ margin: "10px auto" }} />
                    <p>No employees match your search and filter criteria.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Details Modal */}
      {selectedEmployee && (
        <div className="modal-backdrop" onClick={() => setSelectedEmployee(null)}>
          <div
            className="modal-content employee-modal-box"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <div className="modal-title-group">
                <UserCheck size={22} color="#6038df" />
                <h3>
                  {selectedEmployee.name} ({selectedEmployee.employee_id})
                </h3>
              </div>
              <button
                className="modal-close-btn"
                type="button"
                onClick={() => setSelectedEmployee(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {/* Employee Meta Grid */}
              <div className="details-grid">
                <div className="detail-item">
                  <span className="detail-label">Employee ID</span>
                  <strong>{selectedEmployee.employee_id}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Designation</span>
                  <strong>{selectedEmployee.role}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Store</span>
                  <strong>{selectedEmployee.store_id}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Status</span>
                  <strong>{selectedEmployee.status}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Assigned Cases</span>
                  <strong className={selectedEmployee.assigned_cases_count > 0 ? "text-purple" : ""}>
                    {selectedEmployee.assigned_cases_count}
                  </strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Active Cases</span>
                  <strong>{selectedEmployee.active_cases_count}</strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Resolved Cases</span>
                  <strong className={selectedEmployee.resolved_cases_count > 0 ? "text-green" : ""}>
                    {selectedEmployee.resolved_cases_count}
                  </strong>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Audit Actions</span>
                  <strong className={selectedEmployee.audit_actions_count > 0 ? "text-blue" : ""}>
                    {selectedEmployee.audit_actions_count}
                  </strong>
                </div>
              </div>

              {/* Assigned Cases Section */}
              <div className="modal-sub-section">
                <h4>
                  <FileText size={16} /> Investigation Cases Portfolio ({employeeCases.length})
                </h4>
                {employeeCases.length === 0 ? (
                  <p className="empty-state">
                    Zero investigation assignments recorded for this employee.
                  </p>
                ) : (
                  <div className="modal-mini-list">
                    {employeeCases.map((c) => (
                      <div
                        key={c.investigation_id}
                        className="modal-mini-item clickable"
                        onClick={() => {
                          setSelectedEmployee(null);
                          onSelectInvestigation(c);
                        }}
                      >
                        <div className="modal-mini-item-content">
                          <strong>
                            {c.investigation_id} &bull; Alert: {c.alert_id}
                          </strong>
                          <p>
                            Store: {c.store_id} &bull; SKU: {c.sku_id} &bull; Opened:{" "}
                            {new Date(c.opened_at).toLocaleDateString()}
                          </p>
                        </div>
                        <span className={`status-pill status-${(c.status || "").toLowerCase()}`}>
                          {c.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Audit Actions History Section */}
              <div className="modal-sub-section">
                <h4>
                  <History size={16} /> Investigation History Actions ({employeeAudits.length})
                </h4>
                {employeeAudits.length === 0 ? (
                  <p className="empty-state">
                    Zero audit actions recorded in investigation_history for this employee.
                  </p>
                ) : (
                  <div className="modal-mini-list">
                    {employeeAudits.map((a) => {
                      const targetStatus = (a.new_status || "").toUpperCase();
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
                        <div key={a.history_id} className="modal-mini-item">
                          <div className="modal-mini-item-content">
                            <div className="modal-mini-header-row">
                              <span className={`timeline-status-badge ${badgeClass}`}>
                                {a.previous_status
                                  ? `${a.previous_status} → ${a.new_status}`
                                  : `Initial: ${a.new_status}`}
                              </span>
                              <span className="modal-mini-time">
                                <Clock size={12} />
                                {new Date(a.changed_at).toLocaleString()}
                              </span>
                            </div>
                            <p className="modal-mini-notes">
                              {a.notes || "Investigation status update."}
                            </p>
                          </div>
                          <CheckCircle2 size={16} color="#059669" className="action-check-icon" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedEmployee(null)}
              >
                Close Staff Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
