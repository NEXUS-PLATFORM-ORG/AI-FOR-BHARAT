import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckSquareOffset, Plus, X, CaretDown } from "@phosphor-icons/react";

import { API_BASE, API_CASES as CASES_API } from "../../lib/apiConfig.js";
const COMPLIANCE_API = `${API_BASE}/compliance`;

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 text-white text-sm font-bold shadow-lg ${
        type === "error" ? "bg-red-600" : "bg-[#0F172A]"
      }`}
    >
      {message}
      <button onClick={onClose}>
        <X size={14} weight="bold" />
      </button>
    </div>
  );
}

// ─── Priority helper ──────────────────────────────────────────────────────────
function getPriority(score) {
  if (score >= 80)
    return {
      label: "High / Immediate",
      color: "text-[#dc2626]",
      bg: "bg-[#fef2f2]",
      border: "border-[#fee2e2]",
      icon: "!",
    };
  if (score >= 50)
    return {
      label: "Medium",
      color: "text-[#d97706]",
      bg: "bg-[#fffbeb]",
      border: "border-[#fef3c7]",
      icon: "~",
    };
  return {
    label: "Low",
    color: "text-[#16a34a]",
    bg: "bg-[#f0fdf4]",
    border: "border-[#bbf7d0]",
    icon: "✓",
  };
}

// ─── Date helper ──────────────────────────────────────────────────────────────
function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}

// ─── Calculate appeal deadline (skip weekends) ────────────────────────────────
function calculateAppealDeadline(decisionDate, limitationDays) {
  if (!decisionDate || !limitationDays) return null;
  const d = new Date(decisionDate);
  d.setDate(d.getDate() + limitationDays);
  const day = d.getDay();
  if (day === 0) d.setDate(d.getDate() - 2); // Sunday -> Friday
  if (day === 6) d.setDate(d.getDate() - 1); // Saturday -> Friday
  return d.toISOString().split("T")[0];
}

// ─── Days remaining helper ────────────────────────────────────────────────────
function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const today = new Date();
  const target = new Date(targetDate);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff;
}

// ─── Deadline color helper ────────────────────────────────────────────────────
function getDeadlineColor(daysRemaining) {
  if (daysRemaining === null) return { color: "text-slate-500", bg: "bg-slate-50" };
  if (daysRemaining < 10) return { color: "text-[#dc2626]", bg: "bg-[#fef2f2]" };
  if (daysRemaining <= 30) return { color: "text-[#d97706]", bg: "bg-[#fffbeb]" };
  return { color: "text-[#16a34a]", bg: "bg-[#f0fdf4]" };
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CompliancePage() {
  const { caseId: paramId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [caseId, setCaseId] = useState(paramId || location.state?.caseId || null);

  // ── Case selector ───────────────────────────────────────────────────────────
  const [allCases, setAllCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);

  // ── Data ────────────────────────────────────────────────────────────────────
  const [caseData, setCaseData] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  // ── Form ────────────────────────────────────────────────────────────────────

  const [officer, setOfficer] = useState("");
  const [deadline, setDeadline] = useState("");
  const [notes, setNotes] = useState("");
  const [decisionLocked, setDecisionLocked] = useState(false);

  // ── Add item form ───────────────────────────────────────────────────────────
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newTargetDays, setNewTargetDays] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const showToast = (message, type = "success") =>
    setToast({ message, type });

  // ── Fetch all cases for dropdown ───────────────────────────────────────────
  useEffect(() => {
    async function fetchAllCases() {
      setLoadingCases(true);
      try {
        const res = await fetch(CASES_API);
        const data = await res.json();
        if (data.cases) setAllCases(data.cases);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setLoadingCases(false);
      }
    }
    fetchAllCases();
  }, []);

  // ── Handle case selection ──────────────────────────────────────────────────
  const handleCaseSelect = (selectedCaseId) => {
    setCaseId(selectedCaseId);
    navigate(`/reviewer/compliance/${selectedCaseId}`, { replace: true });
    setShowCaseDropdown(false);
  };

  // ── Fetch checklist ─────────────────────────────────────────────────────────
  const fetchChecklist = useCallback(async () => {
    if (!caseId) return;
    try {
      const res = await fetch(`${COMPLIANCE_API}/${caseId}`);
      const data = await res.json();
      if (data.checklist) setChecklist(data.checklist);
    } catch (err) {
      console.error('Failed to fetch checklist:', err);
    }
  }, [caseId]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    async function fetchAll() {
      setLoading(true);
      try {
        const res = await fetch(`${COMPLIANCE_API}/${caseId}`);
        const data = await res.json();

        if (data.case) {
          setCaseData(data.case);
          if (data.case.compliance_decision) {
            setDecisionLocked(true);
          }
          setOfficer(data.case.assigned_officer || "");
          setDeadline(data.case.compliance_deadline || "");
          setNotes(data.case.compliance_notes || "");
        }

        if (data.actionPlan) setActionPlan(data.actionPlan);
        if (data.checklist) setChecklist(data.checklist);
      } catch (err) {
        showToast("Failed to load case data.", "error");
      } finally {
        setLoading(false);
      }
    }
    fetchAll();
  }, [caseId, fetchChecklist]);

  // ── Submit decision ─────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!officer.trim() || !deadline) return;
    setSubmitting(true);
    try {
      const items = [
        {
          item_title: "Initial review of order directives by Legal Cell",
          assigned_to: "Legal",
          target_days: 3,
          is_mandatory: true,
          target_date: addDays(3),
        },
        {
          item_title: `Draft compliance report: ${actionPlan?.directive_summary || ""}`,
          assigned_to: "Legal",
          target_days: 15,
          is_mandatory: true,
          target_date: addDays(15),
        },
        {
          item_title: "Final submission to the court registry",
          assigned_to: "Filing Department",
          target_days: 30,
          is_mandatory: true,
          target_date: addDays(30),
        },
      ];

      const checklistItems = items.map((item) => ({
        ...item,
        case_id: caseId,
        action_plan_id: actionPlan?.id || null,
        source: "system_generated",
        is_completed: false,
      }));

      const res = await fetch(`${COMPLIANCE_API}/${caseId}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision: 'comply',
          officer,
          deadline,
          notes,
          userId: null,
          checklistItems,
          actionType: 'decision_made'
        })
      });

      if (!res.ok) throw new Error('Failed to submit decision');

      await fetchChecklist();
      setDecisionLocked(true);
      showToast("Decision recorded. Checklist generated.");
    } catch (err) {
      showToast(err.message || "Failed to submit decision.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Toggle checklist item ───────────────────────────────────────────────────
  const toggleItem = async (item) => {
    if (item.is_completed) return;
    try {
      const res = await fetch(`${COMPLIANCE_API}/checklist/${item.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: null })
      });

      if (!res.ok) throw new Error('Failed to update item');

      setChecklist((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, is_completed: true } : i))
      );
    } catch (err) {
      showToast("Failed to update item.", "error");
    }
  };

  // ── Add manual item ─────────────────────────────────────────────────────────
  const handleAddItem = async () => {
    if (!newTitle.trim()) return;
    setAddingItem(true);
    try {
      const res = await fetch(`${COMPLIANCE_API}/${caseId}/checklist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          assignedTo: newAssignedTo.trim() || null,
          targetDays: newTargetDays ? parseInt(newTargetDays) : null
        })
      });

      if (!res.ok) throw new Error('Failed to add item');

      await fetchChecklist();
      setNewTitle("");
      setNewAssignedTo("");
      setNewTargetDays("");
      setShowAddForm(false);
    } catch (err) {
      showToast("Failed to add item.", "error");
    } finally {
      setAddingItem(false);
    }
  };

  // ── Derived ─────────────────────────────────────────────────────────────────
  const canSubmit = officer.trim() && deadline && !decisionLocked;
  const priority = getPriority(actionPlan?.confidence_score ?? 0);

  // ── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#0F172A] rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading case data...</span>
        </div>
      </div>
    );
  }

  // ── Case selector UI (when no case selected) ───────────────────────────────
  if (!caseId) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc]">
        <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-12 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">
              Select a Case for Compliance Review
            </h2>
            <p className="text-sm text-slate-500">
              Choose a case from the dropdown below to begin compliance processing.
            </p>
          </div>

          {/* Case dropdown */}
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowCaseDropdown(!showCaseDropdown)}
              className="w-full bg-white border-2 border-slate-300 px-4 py-3 text-left text-sm font-medium text-[#0F172A] focus:outline-none hover:border-[#0F172A] transition-colors flex items-center justify-between gap-3"
            >
              <span className="text-slate-400">
                {loadingCases ? "Loading cases..." : "Select a case..."}
              </span>
              <CaretDown
                size={16}
                weight="bold"
                className={`text-slate-400 transition-transform ${
                  showCaseDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCaseDropdown && allCases.length > 0 && (
              <div className="absolute top-full left-0 mt-2 w-full bg-white border border-slate-200 shadow-xl z-50 max-h-80 overflow-y-auto">
                {allCases.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => handleCaseSelect(c.id)}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-b-0"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#0F172A] truncate">
                          {c.case_id || c.id}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {c.court} · {c.department}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                          c.status === "APPROVED"
                            ? "bg-[#dcfce7] text-[#166534]"
                            : c.status === "REJECTED"
                            ? "bg-[#fee2e2] text-[#991b1b]"
                            : "bg-[#F1F5F9] text-[#64748b]"
                        }`}
                      >
                        {c.status}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {allCases.length === 0 && !loadingCases && (
            <p className="text-sm text-slate-400 italic">
              No cases available. Upload a case from the Dashboard first.
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc] text-slate-800">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      {/* Case selector strip (when case is loaded) */}
      <div className="mb-6 bg-white border border-slate-200 shadow-sm p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Selected Case
          </span>
          {loading ? (
            <span className="text-sm text-slate-400 italic">Loading...</span>
          ) : caseData ? (
            <>
              <span className="text-sm font-bold text-[#0F172A] truncate">
                {caseData.case_id || caseData.case_number || caseId}
              </span>
              {caseData.court && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="text-sm text-slate-500 truncate">
                    {caseData.court}
                  </span>
                </>
              )}
              {caseData.department && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="inline-block px-2 py-0.5 bg-[#F1F5F9] text-[#64748b] text-[10px] font-bold tracking-wider uppercase">
                    {caseData.department}
                  </span>
                </>
              )}
            </>
          ) : (
            <span className="text-sm text-slate-400 italic">No data</span>
          )}
        </div>

        {/* Change case button */}
        <button
          onClick={() => {
            setCaseId(null);
            navigate("/reviewer/compliance", { replace: true });
          }}
          className="px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-colors shrink-0"
        >
          Change Case
        </button>
      </div>


      <div className="flex flex-col lg:flex-row gap-6">
        {/* ── Left Column ─────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Decision Confirmation */}
          <div className="bg-white p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckSquareOffset
                  size={24}
                  weight="bold"
                  className="text-[#1e293b]"
                />
                <h2 className="text-xl font-bold text-[#1e293b]">
                  Decision Confirmation
                </h2>
              </div>
              {decisionLocked && (
                <span className="px-3 py-1 bg-[#dcfce7] text-[#166534] text-[10px] font-bold uppercase tracking-wider">
                  Decision Made
                </span>
              )}
            </div>

            {/* AI recommendation */}
            {actionPlan?.system_decision && (
              <p className="text-[12px] font-bold text-[#d97706] uppercase tracking-wider -mb-2">
                AI Recommendation:{" "}
                <span className="text-[#dc2626]">
                  {actionPlan.system_decision}
                </span>
              </p>
            )}

            {/* Decision cards */}
            <div className="border-2 border-[#0F172A] bg-[#f8fafc] p-5">
              <h3 className="font-bold text-[#1e293b] mb-2 text-[15px]">Comply</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">
                Initiate implementation steps for the judicial directives and generate the compliance checklist.
              </p>
            </div>
          </div>

          {/* Administrative Details */}
          <div className="bg-white p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col gap-6">
            <h2 className="text-xl font-bold text-[#1e293b] mb-2">
              Administrative Details
            </h2>

            <div className="flex flex-col sm:flex-row gap-6">
              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#1e293b] uppercase tracking-wider mb-2">
                  RESPONSIBILITY ASSIGNMENT
                </label>
                <input
                  type="text"
                  value={officer}
                  onChange={(e) => setOfficer(e.target.value)}
                  placeholder="Officer / Department name"
                  disabled={decisionLocked}
                  className="w-full border border-slate-300 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-slate-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              <div className="flex-1">
                <label className="block text-[11px] font-bold text-[#1e293b] uppercase tracking-wider mb-2">
                  FINAL DEADLINE
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  disabled={decisionLocked}
                  className="w-full border border-slate-300 px-3 py-2.5 text-sm text-slate-600 focus:outline-none focus:border-slate-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                />
                {actionPlan?.limitation_days && (
                  <p className="text-[11px] text-[#d97706] font-medium mt-1">
                    Statutory limit: {actionPlan.limitation_days} days from
                    judgment date
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#1e293b] uppercase tracking-wider mb-2">
                DECISION NOTES
              </label>
              <textarea
                rows="5"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={decisionLocked}
                placeholder="Provide context for the decision or specific instructions for the assignee..."
                className="w-full border border-slate-300 p-4 text-sm text-slate-600 focus:outline-none focus:border-slate-400 resize-none disabled:bg-slate-50 disabled:text-slate-400"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            className="w-full py-3.5 bg-[#0F172A] text-white text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Submitting..."
              : decisionLocked
              ? "Decision Already Submitted"
              : "Submit Decision"}
          </button>
        </div>

        {/* ── Right Column ─────────────────────────────────────────────────── */}
        <div className="w-full lg:w-[380px] shrink-0 flex flex-col gap-6">

          {/* Compliance Checklist */}
          <div className="bg-white p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-[#1e293b] leading-tight pr-4">
                Compliance
                <br />
                Checklist
              </h2>
              <span className="inline-block px-3 py-1.5 bg-[#e0e7ff] text-[#3730a3] text-[9px] font-bold uppercase tracking-wider mt-1">
                SYSTEM
                <br />
                GENERATED
              </span>
            </div>

            {decisionLocked && caseData?.compliance_decision === "comply" && caseData?.compliance_deadline && (
              <div className="bg-[#ecfdf5] border-l-4 border-[#22c55e] p-4 mb-6">
                <p className="text-[13px] font-bold text-[#166534]">
                  ⏰ Compliance deadline: {caseData.compliance_deadline}
                </p>
                {(() => {
                  const remaining = getDaysRemaining(caseData.compliance_deadline);
                  return remaining !== null && (
                    <p className="text-[11px] text-[#14532d] mt-1">
                      {remaining} days remaining
                    </p>
                  );
                })()}
              </div>
            )}

            {/* Directive summary */}
            {actionPlan?.directive_summary && (
              <div className="bg-[#eff6ff] border border-dashed border-[#93c5fd] p-4 mb-6">
                <p className="text-[13px] text-[#1e40af] italic leading-relaxed">
                  "Captured from Judgment: {actionPlan.directive_summary}"
                </p>
              </div>
            )}

            {/* Checklist items */}
            {checklist.length === 0 ? (
              <p className="text-[13px] text-slate-400 italic mb-6 flex-1">
                Select a decision and submit to generate checklist.
              </p>
            ) : (
              <div className="space-y-5 mb-6 flex-1">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      onClick={() => toggleItem(item)}
                      disabled={item.is_completed}
                      className="mt-0.5 shrink-0 w-4 h-4 border border-slate-300 flex items-center justify-center transition-colors disabled:cursor-default"
                      style={{
                        background: item.is_completed ? "#16a34a" : "white",
                        borderColor: item.is_completed ? "#16a34a" : undefined,
                      }}
                    >
                      {item.is_completed && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                        >
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="white"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p
                          className={`text-sm font-bold text-[#1e293b] ${
                            item.is_completed
                              ? "line-through text-slate-400"
                              : ""
                          }`}
                        >
                          {item.item_title}
                        </p>
                        {item.is_mandatory && (
                          <span className="px-1.5 py-0.5 bg-[#fef2f2] text-[#dc2626] text-[9px] font-bold uppercase tracking-wider">
                            MANDATORY
                          </span>
                        )}
                        {item.source === "manual" && (
                          <span className="px-1.5 py-0.5 bg-[#f1f5f9] text-[#64748b] text-[9px] font-bold uppercase tracking-wider">
                            MANUAL
                          </span>
                        )}
                      </div>
                      <p className="text-[12px] text-slate-500 leading-snug">
                        {[
                          item.item_description,
                          item.assigned_to && `Assigned: ${item.assigned_to}`,
                          item.target_days && `Due: T+${item.target_days} days`,
                        ]
                          .filter(Boolean)
                          .join(" | ")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add item inline form */}
            {showAddForm && (
              <div className="border border-slate-200 p-4 mb-4 flex flex-col gap-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Item title *"
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  placeholder="Assigned to"
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
                <input
                  type="number"
                  value={newTargetDays}
                  onChange={(e) => setNewTargetDays(e.target.value)}
                  placeholder="Target days (e.g. 7)"
                  className="w-full border border-slate-300 px-3 py-2 text-sm text-slate-600 focus:outline-none focus:border-slate-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    disabled={addingItem || !newTitle.trim()}
                    className="flex-1 py-2 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {addingItem ? "Adding..." : "Add"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTitle("");
                      setNewAssignedTo("");
                      setNewTargetDays("");
                    }}
                    className="px-4 py-2 border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Add action item button */}
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="w-full py-3 border-2 border-[#1e293b] text-[#1e293b] text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors shrink-0 flex items-center justify-center gap-2"
            >
              <Plus size={14} weight="bold" /> ADD ACTION ITEM
            </button>
          </div>

          {/* Case Priority */}
          <div
            className={`p-6 flex items-center justify-between border ${priority.bg} ${priority.border}`}
          >
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-wider mb-1 ${priority.color}`}
              >
                CASE PRIORITY
              </p>
              <p className={`text-[19px] font-bold ${priority.color}`}>
                {priority.label}
              </p>
              {actionPlan?.confidence_score != null && (
                <p className={`text-[11px] font-medium mt-0.5 ${priority.color}`}>
                  Confidence score: {actionPlan.confidence_score}
                </p>
              )}
            </div>
            <div className={`font-black text-3xl ${priority.color}`}>
              {priority.icon}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
