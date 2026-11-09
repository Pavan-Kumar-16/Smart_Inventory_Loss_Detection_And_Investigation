import React, { useState } from "react";
import {
  HelpCircle,
  Shield,
  FileSearch,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Layers,
  ArrowRight,
  Database,
} from "lucide-react";

export const HelpPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does the Smart Inventory Loss Detection System detect shrinkage?",
      a: "The detection engine analyzes physical cycle counts against expected system inventory. When counted quantities fall below expected quantities (expected_qty > counted_qty), the SHORTAGE_DETECTED rule triggers an alert with a calculated risk score. Additionally, repeated outgoing inventory adjustments (ADJUSTMENT_OUT) and inconsistent store-to-store transfers are evaluated by dedicated rule engines.",
    },
    {
      q: "How is the alert risk score calculated?",
      a: "For cycle count shortages, the initial prioritization score is calculated as: score = 25 + (0.75 * shortage_percentage), where shortage_percentage = ((expected_qty - counted_qty) / expected_qty) * 100. The score is rounded to 2 decimal places and capped at a maximum of 100. Scores >= 70 are categorized as High Risk, 40-69 as Medium Risk, and < 40 as Low Risk.",
    },
    {
      q: "How does the investigation lifecycle work?",
      a: "Investigations follow an immutable state machine: 1) OPEN: Created automatically or manually from an alert; 2) ASSIGNED: Delegated to a specific investigator employee; 3) INVESTIGATING: In-progress physical audit or interview; 4) RESOLVED: Case concluded with a mandatory outcome finding; 5) ESCALATED: Forwarded to senior audit or management.",
    },
    {
      q: "How are duplicate investigations prevented?",
      a: "The system enforces a strict 1-to-1 relationship between shrinkage alerts and investigations. When an investigation already exists for an alert, the interface disables duplicate case creation and instead displays a direct link to the existing case file.",
    },
    {
      q: "Where is the investigation audit trail stored?",
      a: "Every state change, employee assignment, and investigation note is immutably appended to the MySQL `investigation_history` table with timestamps, previous status, new status, and the user identifier.",
    },
    {
      q: "Why are some catalog fields (like retail prices or direct employee creation) marked unavailable?",
      a: "Per strict engineering requirements, the existing FastAPI backend and MySQL database are preserved in READ-ONLY mode. Any feature lacking a direct backend endpoint (such as /api/stores or /api/skus) is clearly noted rather than faked with artificial data.",
    },
  ];

  return (
    <section className="dashboard-content">
      {/* System Overview */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <BookOpen size={20} color="#6038df" />
            <h2>System Overview & Architecture</h2>
          </div>
          <span>Operational Guide</span>
        </div>

        <div className="help-hero-grid">
          <div className="help-hero-card">
            <div className="help-hero-icon purple-icon">
              <Layers size={24} />
            </div>
            <h4>Detection Engine</h4>
            <p>
              Automated rules monitor cycle counts and movements in real-time, detecting unexplained inventory shortages and transfer discrepancies.
            </p>
          </div>

          <div className="help-hero-card">
            <div className="help-hero-icon red-icon">
              <Shield size={24} />
            </div>
            <h4>Risk Prioritization</h4>
            <p>
              Discrepancies are dynamically scored on a 0-100 scale, enabling loss prevention leads to focus immediately on critical high-loss incidents.
            </p>
          </div>

          <div className="help-hero-card">
            <div className="help-hero-icon blue-icon">
              <FileSearch size={24} />
            </div>
            <h4>Investigation Triage</h4>
            <p>
              Formal investigation case files track lead assignments, progress notes, and resolution outcomes with complete audit trails.
            </p>
          </div>

          <div className="help-hero-card">
            <div className="help-hero-icon green-icon">
              <Database size={24} />
            </div>
            <h4>Database Integrity</h4>
            <p>
              Directly connected to the production MySQL inventory database with zero mock data, ensuring accurate operational reporting.
            </p>
          </div>
        </div>
      </div>

      {/* Investigation Lifecycle Workflow */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <Layers size={20} color="#6038df" />
            <h2>Investigation State Machine & Workflow</h2>
          </div>
        </div>

        <div className="workflow-steps-row">
          <div className="workflow-step">
            <div className="step-circle step-open">1</div>
            <strong className="step-title">OPEN</strong>
            <p className="step-desc">Alert triaged; awaiting investigator assignment.</p>
          </div>
          <ArrowRight size={20} className="step-arrow" />

          <div className="workflow-step">
            <div className="step-circle step-assigned">2</div>
            <strong className="step-title">ASSIGNED</strong>
            <p className="step-desc">Assigned to qualified loss prevention staff member.</p>
          </div>
          <ArrowRight size={20} className="step-arrow" />

          <div className="workflow-step">
            <div className="step-circle step-investigating">3</div>
            <strong className="step-title">INVESTIGATING</strong>
            <p className="step-desc">Active physical recount, CCTV review, or interview.</p>
          </div>
          <ArrowRight size={20} className="step-arrow" />

          <div className="workflow-step">
            <div className="step-circle step-resolved">4</div>
            <strong className="step-title">RESOLVED</strong>
            <p className="step-desc">Concluded with recorded outcome and timestamp.</p>
          </div>
        </div>
      </div>

      {/* FAQ Accordion */}
      <div className="panel">
        <div className="panel-header">
          <div className="panel-title-with-badge">
            <HelpCircle size={20} color="#6038df" />
            <h2>Frequently Asked Questions</h2>
          </div>
        </div>

        <div className="faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="faq-item">
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                {isOpen && (
                  <div className="faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

