import { useState, useEffect, useCallback } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { CheckSquareOffset, Plus, X, CaretDown } from "@phosphor-icons/react";

import { API_BASE, API_CASES as CASES_API } from "../../lib/apiConfig.js";
const APPEALS_API = `${API_BASE}/appeals`;

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
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

function formatDate(dateString) {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "short", day: "2-digit", year: "numeric" });
}

function getDaysRemaining(targetDate) {
  if (!targetDate) return null;
  const today = new Date();
  const target = new Date(targetDate);
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function getDeadlineColor(daysRemaining) {
  if (daysRemaining === null) return { color: "text-slate-500", bg: "bg-slate-50" };
  if (daysRemaining < 10) return { color: "text-[#dc2626]", bg: "bg-[#fef2f2]" };
  if (daysRemaining <= 30) return { color: "text-[#d97706]", bg: "bg-[#fffbeb]" };
  return { color: "text-[#16a34a]", bg: "bg-[#f0fdf4]" };
}

function determineCourtLevel(court) {
  if (!court) return "High Court";
  const lowered = court.toLowerCase();
  if (lowered.includes("supreme")) return "Supreme Court";
  return "High Court";
}

export function AppealPage() {
  const { caseId: routeCaseId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [caseId, setCaseId] = useState(routeCaseId || location.state?.caseId || null);
  const [allCases, setAllCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(false);
  const [showCaseDropdown, setShowCaseDropdown] = useState(false);
  const [caseData, setCaseData] = useState(null);
  const [actionPlan, setActionPlan] = useState(null);
  const [appeal, setAppeal] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [loading, setLoading] = useState(Boolean(routeCaseId || location.state?.caseId));
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const [officer, setOfficer] = useState("");
  const [department, setDepartment] = useState("");
  const [appealGrounds, setAppealGrounds] = useState("");
  const [stayApplicationFiled, setStayApplicationFiled] = useState(false);
  const [notes, setNotes] = useState("");
  const [decisionDate, setDecisionDate] = useState("");
  const [courtLevel, setCourtLevel] = useState("High Court");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignedTo, setNewAssignedTo] = useState("");
  const [newTargetDays, setNewTargetDays] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  useEffect(() => {
    async function fetchAllCases() {
      setLoadingCases(true);
      try {
        const res = await fetch(CASES_API);
        const data = await res.json();
        if (data.cases) setAllCases(data.cases);
      } catch (error) {
        console.error("Failed to load cases:", error);
      } finally {
        setLoadingCases(false);
      }
    }
    fetchAllCases();
  }, []);

  const loadAppealData = useCallback(async () => {
    if (!caseId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${APPEALS_API}/${caseId}`);
      const data = await res.json();
      if (data.case) {
        setCaseData(data.case);
        setCourtLevel(determineCourtLevel(data.case.court));
        setDecisionDate(data.case.decision_date || "");
      }
      setActionPlan(data.actionPlan || null);
      setAppeal(data.appeal || null);
      setChecklist(data.checklist || []);
    } catch (error) {
      console.error("Failed to load appeal data:", error);
      setToast({ message: "Unable to load appeal data.", type: "error" });
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    loadAppealData();
  }, [caseId, loadAppealData]);

  const showToast = (message, type = "success") => setToast({ message, type });

  const handleCaseSelect = (selectedCaseId) => {
    setCaseId(selectedCaseId);
    navigate(`/reviewer/appeal/${selectedCaseId}`, { replace: true });
    setShowCaseDropdown(false);
  };

  const handleInitiateAppeal = async () => {
    if (!officer.trim() || !appealGrounds.trim() || !decisionDate || !courtLevel) {
      showToast("Please complete the appeal form before submitting.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        officer: officer.trim(),
        department: department.trim() || null,
        appealGrounds: appealGrounds.trim(),
        stayApplicationFiled,
        notes: notes.trim() || null,
        userId: null,
        decisionDate,
        courtLevel,
      };

      const res = await fetch(`${APPEALS_API}/${caseId}/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to initiate appeal.");
      }

      const data = await res.json();
      await loadAppealData();
      showToast(`Appeal initiated successfully. Deadline: ${data.deadline}`);
    } catch (error) {
      showToast(error.message || "Failed to initiate appeal.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleChecklistItem = async (item) => {
    if (item.is_completed) return;
    try {
      const res = await fetch(`${APPEALS_API}/checklist/${item.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: null }),
      });
      if (!res.ok) throw new Error("Unable to update item.");
      setChecklist((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_completed: true } : i)));
    } catch (error) {
      showToast("Failed to update checklist item.", "error");
    }
  };

  const handleAddItem = async () => {
    if (!newTitle.trim() || !appeal?.id) return;
    setAddingItem(true);
    try {
      const res = await fetch(`${APPEALS_API}/${appeal.id}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          title: newTitle.trim(),
          assignedTo: newAssignedTo.trim() || null,
          targetDays: newTargetDays ? parseInt(newTargetDays, 10) : null,
        }),
      });
      if (!res.ok) throw new Error("Unable to add checklist item.");
      await loadAppealData();
      setNewTitle("");
      setNewAssignedTo("");
      setNewTargetDays("");
      setShowAddForm(false);
    } catch (error) {
      showToast(error.message || "Failed to add item.", "error");
    } finally {
      setAddingItem(false);
    }
  };

  const canSubmit = !appeal && officer.trim() && appealGrounds.trim() && decisionDate && courtLevel;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-2 border-slate-300 border-t-[#0F172A] rounded-full animate-spin" />
          <span className="text-sm font-medium">Loading appeal workspace...</span>
        </div>
      </div>
    );
  }

  if (!caseId) {
    return (
      <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc]">
        <div className="bg-white border border-slate-200 shadow-sm p-8 md:p-12 flex flex-col items-center justify-center gap-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-[#0F172A] mb-2">Start an Appeal</h2>
            <p className="text-sm text-slate-500">Select a case below to create a standalone appeal workflow.</p>
          </div>
          <div className="relative w-full max-w-md">
            <button
              onClick={() => setShowCaseDropdown(!showCaseDropdown)}
              className="w-full bg-white border-2 border-slate-300 px-4 py-3 text-left text-sm font-medium text-[#0F172A] focus:outline-none hover:border-[#0F172A] transition-colors flex items-center justify-between gap-3"
            >
              <span className="text-slate-400">{loadingCases ? "Loading cases..." : "Select a case..."}</span>
              <CaretDown size={16} weight="bold" className={`text-slate-400 transition-transform ${showCaseDropdown ? "rotate-180" : ""}`} />
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
                        <p className="text-sm font-bold text-[#0F172A] truncate">{c.case_id || c.id}</p>
                        <p className="text-xs text-slate-500 truncate">{c.court} · {c.department}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#f1f5f9] text-slate-600">{c.status}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
          {allCases.length === 0 && !loadingCases && (
            <p className="text-sm text-slate-400 italic">No cases available yet. Add a case first from the dashboard.</p>
          )}
        </div>
      </div>
    );
  }

  const deadlineColor = getDeadlineColor(getDaysRemaining(appeal?.calculated_deadline));
  const statusLabel = appeal ? appeal.appeal_status.toUpperCase() : "NOT STARTED";

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc] text-slate-800">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="mb-6 bg-white border border-slate-200 shadow-sm p-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">Selected Case</p>
          <h1 className="text-2xl font-bold text-[#0F172A] truncate">{caseData?.case_id || caseId}</h1>
          <p className="text-sm text-slate-500 mt-1">{caseData?.court || "Court not available"} · {caseData?.department || "Department not available"}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={() => {
              setCaseId(null);
              navigate("/reviewer/appeal", { replace: true });
            }}
            className="px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Change Case
          </button>
          <span className="inline-flex items-center gap-2 px-3 py-2 rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-600">
            APPEAL STATUS: {statusLabel}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_0.95fr] gap-6">
        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b]">Appeal Initiation</h2>
                <p className="text-sm text-slate-500 mt-1">Create a dedicated appeal workflow for the selected case.</p>
              </div>
              {appeal && (
                <span className="px-3 py-1 bg-[#ecfdf5] text-[#166534] text-[11px] font-bold uppercase tracking-wider border border-[#d1fae5]">
                  Created on {formatDate(appeal.created_at)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Appeal Type</label>
                <input
                  type="text"
                  readOnly
                  value={appeal ? appeal.appeal_type.replaceAll('_', ' ') : courtLevel === 'Supreme Court' ? 'Review Petition' : 'Regular Appeal'}
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-700"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Court Level</label>
                <input
                  type="text"
                  readOnly
                  value={courtLevel}
                  className="w-full border border-slate-300 px-3 py-2 text-sm bg-slate-50 text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Officer / Department</label>
                <input
                  type="text"
                  value={officer}
                  onChange={(e) => setOfficer(e.target.value)}
                  disabled={!!appeal}
                  placeholder="Enter assigned officer"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!!appeal}
                  placeholder="Optional"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Judgment / Decision Date</label>
                <input
                  type="date"
                  value={decisionDate}
                  onChange={(e) => setDecisionDate(e.target.value)}
                  disabled={!!appeal}
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>
              <div className="flex items-end gap-3">
                <label className="flex-1 text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Stay Application</label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={stayApplicationFiled}
                    onChange={(e) => setStayApplicationFiled(e.target.checked)}
                    disabled={!!appeal}
                    className="h-4 w-4 text-[#0F172A] border-slate-300 rounded focus:ring-[#0F172A]"
                  />
                  Filed
                </label>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Appeal Grounds</label>
              <textarea
                rows="5"
                value={appealGrounds}
                onChange={(e) => setAppealGrounds(e.target.value)}
                disabled={!!appeal}
                placeholder="Summarize the grounds for appeal"
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 resize-none"
              />
            </div>

            <div className="mt-4">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-2">Notes</label>
              <textarea
                rows="4"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!!appeal}
                placeholder="Optional instructions or commentary"
                className="w-full border border-slate-300 p-3 text-sm focus:outline-none focus:border-slate-400 disabled:bg-slate-50 disabled:text-slate-400 resize-none"
              />
            </div>

            {!appeal ? (
              <button
                onClick={handleInitiateAppeal}
                disabled={!canSubmit || submitting}
                className="mt-6 w-full py-3.5 bg-[#0F172A] text-white text-sm font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Initiating appeal..." : "Initiate Appeal"}
              </button>
            ) : (
              <div className="mt-6 rounded-xl border border-slate-200 bg-[#f8fafc] p-4">
                <p className="text-sm font-bold text-[#1e293b] mb-2">Appeal workflow is active.</p>
                <p className="text-sm text-slate-600">Use the checklist panel to track completion and file the petition as required.</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-[#1e293b]">Appeal Timeline</h2>
                <p className="text-sm text-slate-500 mt-1">Monitor appeal progress and status changes.</p>
              </div>
              {appeal?.calculated_deadline && (
                <span className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${deadlineColor.bg} ${deadlineColor.color}`}>
                  Deadline {formatDate(appeal.calculated_deadline)}
                </span>
              )}
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-[#1e293b]">Appeal Created</p>
                <p className="text-sm text-slate-600 mt-1">The appeal workflow begins once initiation is submitted.</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-bold text-[#1e293b]">Checklist Generated</p>
                <p className="text-sm text-slate-600 mt-1">System-generated tasks will appear below for completion.</p>
              </div>
              {appeal && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-[#1e293b]">Current Status</p>
                  <p className="text-sm text-slate-600 mt-1">{statusLabel}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#1e293b]">Appeal Checklist</h2>
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{checklist.length} items</span>
            </div>

            {checklist.length === 0 ? (
              <p className="text-sm text-slate-500">No checklist items available yet. Initiate appeal to generate the workflow.</p>
            ) : (
              <div className="space-y-4">
                {checklist.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                    <button
                      onClick={() => toggleChecklistItem(item)}
                      disabled={item.is_completed}
                      className="mt-1 shrink-0 w-5 h-5 border border-slate-300 flex items-center justify-center rounded transition-colors disabled:cursor-default"
                      style={{
                        background: item.is_completed ? "#16a34a" : "white",
                        borderColor: item.is_completed ? "#16a34a" : undefined,
                      }}
                    >
                      {item.is_completed && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                          <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <p className={`font-bold text-sm ${item.is_completed ? "text-slate-400 line-through" : "text-[#0f172a]"}`}>{item.item_title}</p>
                        {item.is_mandatory && (
                          <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#fee2e2] text-[#b91c1c] rounded-full">Mandatory</span>
                        )}
                      </div>
                      <p className="text-[13px] text-slate-500">{[item.assigned_to && `Assigned: ${item.assigned_to}`, item.target_days && `Due in ${item.target_days}d`].filter(Boolean).join(" · ")}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showAddForm && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="New checklist item title"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                />
                <input
                  type="text"
                  value={newAssignedTo}
                  onChange={(e) => setNewAssignedTo(e.target.value)}
                  placeholder="Assigned to"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                />
                <input
                  type="number"
                  value={newTargetDays}
                  onChange={(e) => setNewTargetDays(e.target.value)}
                  placeholder="Target days"
                  className="w-full border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:border-slate-400"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddItem}
                    disabled={addingItem || !newTitle.trim()}
                    className="flex-1 py-2 bg-[#0F172A] text-white text-xs font-bold uppercase tracking-wider hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {addingItem ? "Adding..." : "Add Item"}
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewTitle("");
                      setNewAssignedTo("");
                      setNewTargetDays("");
                    }}
                    className="px-4 py-2 border border-slate-200 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <button
              onClick={() => setShowAddForm((current) => !current)}
              className="mt-5 w-full py-3 border border-[#1e293b] text-[#1e293b] text-xs font-bold uppercase tracking-wider hover:bg-slate-50 transition-colors"
            >
              <span className="inline-flex items-center gap-2 justify-center">
                <Plus size={14} weight="bold" /> Add checklist item
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
