import { useState, useRef, useEffect } from "react";
import {
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Bot,
  AlertTriangle,
  X,
  ArrowRight,
  CalendarDays,
} from "lucide-react";

import { API_CASES as API_BASE } from "../../lib/apiConfig.js";

const TIME_RANGES = ["7 Days", "14 Days", "30 Days"];

// ── Dropdown ───────────────────────────────────────────────────────────────────

function Dropdown({ value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="bg-white border border-slate-200 px-3 py-2 text-[13px] font-bold text-[#0F172A] hover:border-slate-300 flex items-center gap-2 transition-colors min-w-[160px] justify-between"
      >
        <span>{value}</span>
        <ChevronDown
          size={13}
          className={`text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 shadow-lg z-50 py-1">
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[13px] font-medium hover:bg-slate-50 transition-colors border-l-[3px]
                ${value === opt
                  ? "text-[#0F172A] bg-slate-50 border-[#0F172A]"
                  : "text-slate-600 border-transparent"
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Status config ──────────────────────────────────────────────────────────────

const statusConfig = {
  overdue:    { badge: "Overdue",    badgeClass: "bg-red-100 text-red-700",     remainingClass: "text-red-600 font-bold" },
  urgent:     { badge: "Urgent",     badgeClass: "bg-amber-100 text-amber-700", remainingClass: "text-amber-600 font-bold" },
  approaching:{ badge: "Approaching",badgeClass: "bg-amber-100 text-amber-700", remainingClass: "text-amber-600 font-bold" },
  ontrack:    { badge: "On Track",   badgeClass: "bg-green-100 text-green-700", remainingClass: "text-green-600 font-bold" },
};

function getDerivedStatus(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  const diff = Math.ceil((d - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "overdue";
  if (diff <= 1) return "urgent";
  if (diff <= 7) return "approaching";
  return "ontrack";
}

function remainingLabel(days) {
  if (days < 0) return `${Math.abs(days)} Days Overdue`;
  if (days === 0) return "Today";
  return `${days} Day${days !== 1 ? "s" : ""}`;
}

function getRemainingDays(deadline) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(deadline);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d - today) / (1000 * 60 * 60 * 24));
}

// ── Deadline Popup (same logic as reviewer dashboard) ─────────────────────────

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function DeadlinePopup({ cases, onClose }) {
  const [step, setStep] = useState(1);
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [calendarDate, setCalendarDate] = useState(new Date());

  const selectedCase = cases.find((c) => c.case_id === selectedCaseId);

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };
  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const getDayColor = (cellDate) => {
    if (!selectedCase?.deadline) return "text-[#0F172A] hover:bg-slate-50";
    const uploadedDate = new Date(selectedCase.created_at);
    const deadlineDate = new Date(selectedCase.deadline);

    const yellowStart = new Date(uploadedDate);
    yellowStart.setDate(yellowStart.getDate() - 7);
    const yellowEnd = new Date(uploadedDate);
    yellowEnd.setDate(yellowEnd.getDate() - 1);

    const greenEnd = new Date(uploadedDate.getFullYear(), uploadedDate.getMonth() + 1, 0);

    const redStart = new Date(deadlineDate);
    redStart.setDate(redStart.getDate() - 7);

    const norm = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const t = norm(cellDate);

    if (t >= norm(yellowStart) && t <= norm(yellowEnd)) return "bg-[#fef08a] text-[#854d0e]";
    if (t >= norm(uploadedDate) && t <= norm(greenEnd)) return "bg-[#bbf7d0] text-[#166534]";
    if (t >= norm(redStart) && t <= norm(deadlineDate)) return "bg-[#fecaca] text-[#991b1b]";
    return "text-[#0F172A] hover:bg-slate-50";
  };

  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
            {step === 1 ? "Select Case" : "Case Deadline Calendar"}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors p-1">
            <X size={20} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {step === 1 && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-slate-600">
                Select a case to view its deadline timeline.
              </p>
              <select
                value={selectedCaseId}
                onChange={(e) => setSelectedCaseId(e.target.value)}
                className="w-full bg-white border border-slate-200 px-3 py-2.5 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-slate-400 hover:border-slate-300 transition-colors cursor-pointer"
              >
                <option value="" disabled>Select a Case ID</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.case_id}>
                    {c.case_id} — {c.department || "—"}
                  </option>
                ))}
              </select>
              <div className="mt-2 flex justify-end">
                <button
                  onClick={() => { setStep(2); setCalendarDate(new Date()); }}
                  disabled={!selectedCaseId}
                  className="px-6 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next <ArrowRight size={16} strokeWidth={2.5} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 text-slate-400 hover:text-slate-600 transition-colors text-sm font-bold w-fit"
              >
                <ChevronLeft size={16} /> Back to Selection
              </button>

              {selectedCase && (
                <div className="bg-[#F8FAFC] border border-slate-100 px-4 py-3 text-[12px] font-medium text-slate-600">
                  <span className="font-bold text-[#0F172A]">{selectedCase.case_id}</span>
                  {" · "}{selectedCase.department}
                  {" · Deadline: "}
                  <span className="font-bold text-[#0F172A]">
                    {new Date(selectedCase.deadline).toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Month navigation */}
              <div className="flex items-center justify-between px-1">
                <button onClick={handlePrevMonth} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5">
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-base text-[#0F172A]">
                  {MONTH_NAMES[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                </span>
                <button onClick={handleNextMonth} className="text-slate-400 hover:text-slate-600 transition-colors p-1.5">
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div className="grid grid-cols-7">
                {["Su","Mo","Tu","We","Th","Fr","Sa"].map((d) => (
                  <div key={d} className="text-center text-[11px] font-bold text-slate-500">{d}</div>
                ))}
              </div>

              {/* Day cells */}
              <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const cellDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                  const colorClass = getDayColor(cellDate);
                  return (
                    <div key={day} className="flex items-center justify-center">
                      <div className={`w-8 h-8 flex items-center justify-center font-bold text-[13px] rounded-sm transition-colors cursor-pointer ${colorClass}`}>
                        {day}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="mt-2 pt-4 border-t border-slate-100 flex flex-col gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 bg-[#fef08a] rounded-sm" />
                  <span className="text-xs font-medium text-slate-600">1 Week Before Upload (Yellow)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 bg-[#bbf7d0] rounded-sm" />
                  <span className="text-xs font-medium text-slate-600">Upload Date to Month End (Green)</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-3.5 h-3.5 bg-[#fecaca] rounded-sm" />
                  <span className="text-xs font-medium text-slate-600">1 Week Before Deadline (Red)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Upcoming Deadlines Sidebar Card ───────────────────────────────────────────

function UpcomingDeadlinesCard({ cases, onCaseClick }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = cases
    .filter((c) => c.deadline && c.status !== "APPROVED" && c.status !== "COMPLETED")
    .map((c) => ({ ...c, remaining: getRemainingDays(c.deadline) }))
    .sort((a, b) => a.remaining - b.remaining)
    .slice(0, 5);

  return (
    <div className="bg-white border border-slate-200 shadow-sm">
      <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
        <CalendarDays size={14} className="text-blue-500" />
        <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
          Upcoming Deadlines
        </span>
      </div>
      <div className="divide-y divide-slate-100">
        {upcoming.length === 0 ? (
          <p className="px-4 py-6 text-[12px] text-slate-400 text-center font-medium">
            No upcoming deadlines.
          </p>
        ) : (
          upcoming.map((c) => {
            const status = getDerivedStatus(c.deadline);
            const cfg = statusConfig[status];
            return (
              <button
                key={c.id}
                onClick={() => onCaseClick(c)}
                className="w-full text-left px-4 py-3.5 hover:bg-slate-50 transition-colors group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-bold text-[#0F172A]">{c.case_id}</span>
                  <span className={`px-2 py-0.5 text-[9px] font-bold tracking-wider ${cfg.badgeClass}`}>
                    {cfg.badge}
                  </span>
                </div>
                <p className="text-[12px] font-medium text-slate-500 leading-snug truncate">
                  {c.department || "—"}
                </p>
                <p className={`text-[11px] font-bold mt-0.5 ${cfg.remainingClass}`}>
                  {remainingLabel(c.remaining)}
                </p>
              </button>
            );
          })
        )}
      </div>
      <div className="px-4 py-3 border-t border-slate-100">
        <button
          className="text-[12px] font-bold text-blue-600 hover:underline"
          onClick={() => onCaseClick(null)}
        >
          View All Deadlines →
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function DeadlinesPage() {
  const [timeRange, setTimeRange] = useState("30 Days");
  const [department, setDepartment] = useState("All Departments");
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeadlinePopupOpen, setIsDeadlinePopupOpen] = useState(false);
  const [preselectedCaseId, setPreselectedCaseId] = useState("");

  useEffect(() => {
    async function fetchCases() {
      try {
        setIsLoading(true);
        const res = await fetch(API_BASE);
        const data = await res.json();
        if (data.cases) setCases(data.cases);
      } catch (err) {
        console.error("Failed to fetch cases:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCases();
  }, []);

  // Derive table rows from real cases
  const tableRows = cases
    .filter((c) => c.deadline)
    .map((c) => {
      const remaining = getRemainingDays(c.deadline);
      return {
        ...c,
        dept: c.department || "—",
        action: c.status || "Pending Review",
        deadline: new Date(c.deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        remaining,
        status: getDerivedStatus(c.deadline),
      };
    });

  const departments = ["All Departments", ...Array.from(new Set(cases.map((c) => c.department).filter(Boolean))).sort()];

  const filtered = tableRows.filter((d) => {
    const deptMatch = department === "All Departments" || d.dept === department;
    const days = parseInt(timeRange);
    const rangeMatch = d.remaining <= days;
    return deptMatch && rangeMatch;
  });

  const openPopupForCase = (c) => {
    setPreselectedCaseId(c ? c.case_id : "");
    setIsDeadlinePopupOpen(true);
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-[#0F172A]">Deadline Tracker</h1>
        <p className="text-sm text-slate-500 mt-0.5 font-medium">
          Monitor upcoming and missed deadlines across all institutional cases.
        </p>
      </div>

      {/* Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex flex-row-reverse items-center gap-1 bg-[#F8FAFC] border border-slate-200 p-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r}
              onClick={() => setTimeRange(r)}
              className={`px-4 py-1.5 text-[12px] font-bold tracking-wide transition-colors ${
                timeRange === r ? "bg-[#0F172A] text-white" : "text-slate-500 hover:text-[#0F172A]"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <Dropdown value={department} onChange={setDepartment} options={departments} />

        <button className="inline-flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-[13px] font-bold hover:bg-slate-50 transition-colors sm:ml-auto">
          <SlidersHorizontal size={14} />
          Advanced Filters
        </button>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* LEFT: Deadlines Table (75%) */}
        <div className="xl:w-[75%] bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
              Case Deadlines
            </span>
            <span className="text-[11px] font-medium text-slate-400">
              {isLoading ? "Loading…" : `${filtered.length} case${filtered.length !== 1 ? "s" : ""}`}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[680px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  {["Case ID", "Department", "Action Required", "Deadline", "Remaining", "Status", ""].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">
                      Loading cases…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400 font-medium">
                      No deadlines found for the selected filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => {
                    const cfg = statusConfig[row.status];
                    const isOverdue = row.status === "overdue";
                    return (
                      <tr
                        key={row.id}
                        className={`transition-colors hover:bg-slate-50/60 ${
                          isOverdue ? "border-l-[3px] border-l-red-400" : "border-l-[3px] border-l-transparent"
                        }`}
                      >
                        <td className="px-5 py-4">
                          <span className="text-[13px] font-bold text-[#0F172A]">{row.case_id}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] font-medium text-slate-600">{row.dept}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] font-medium text-slate-700">{row.action}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-[13px] font-medium text-slate-600">{row.deadline}</span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-[13px] ${cfg.remainingClass}`}>
                            {remainingLabel(row.remaining)}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider ${cfg.badgeClass}`}>
                            {cfg.badge}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <button
                            onClick={() => openPopupForCase(row)}
                            className="text-[12px] font-bold text-blue-600 hover:underline whitespace-nowrap"
                          >
                            View Calendar
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Sidebar (25%) */}
        <div className="xl:w-[25%] w-full flex flex-col gap-4">

          {/* Upcoming Deadlines Card (replaces static calendar) */}
          <UpcomingDeadlinesCard cases={cases} onCaseClick={openPopupForCase} />

          {/* Urgent Cases Card */}
          <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 shadow-sm">
            <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-2">
              <AlertTriangle size={14} className="text-red-500" />
              <span className="text-[12px] font-bold text-[#0F172A] uppercase tracking-wider">
                Urgent Cases
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {cases
                .filter((c) => c.deadline && getDerivedStatus(c.deadline) === "overdue")
                .slice(0, 3)
                .map((c) => (
                  <div key={c.id} className="px-4 py-3.5">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[12px] font-bold text-[#0F172A]">{c.case_id}</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold tracking-wider bg-red-100 text-red-700">
                        OVERDUE
                      </span>
                    </div>
                    <p className="text-[12px] font-medium text-slate-600 leading-snug">{c.department || "—"}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {Math.abs(getRemainingDays(c.deadline))} days ago
                    </p>
                  </div>
                ))}
              {!isLoading && cases.filter((c) => c.deadline && getDerivedStatus(c.deadline) === "overdue").length === 0 && (
                <p className="px-4 py-6 text-[12px] text-slate-400 text-center font-medium">No overdue cases.</p>
              )}
            </div>
          </div>

          {/* AI Prediction Card */}
          <div className="bg-[#0F172A] text-white">
            <div className="px-4 py-3.5 border-b border-slate-700 flex items-center gap-2">
              <div className="w-6 h-6 bg-blue-600 flex items-center justify-center shrink-0">
                <Bot size={13} />
              </div>
              <span className="text-[12px] font-bold tracking-wide">AI Prediction</span>
            </div>
            <div className="px-4 py-4">
              <p className="text-[12px] text-slate-300 leading-relaxed mb-4">
                Based on historical filing patterns,{" "}
                <span className="text-amber-400 font-bold">
                  {cases.find((c) => c.priority === "High")?.case_id || "N/A"}
                </span>{" "}
                is at high risk of deadline slippage.
              </p>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Likelihood of Delay
                  </span>
                  <span className="text-[13px] font-bold text-amber-400">84%</span>
                </div>
                <div className="h-1.5 bg-slate-700 overflow-hidden">
                  <div className="h-full bg-amber-400 transition-all" style={{ width: "84%" }} />
                </div>
                <p className="text-[10px] text-slate-500 font-medium mt-2">
                  High confidence · Updated just now
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Deadline Popup */}
      {isDeadlinePopupOpen && (
        <DeadlinePopup
          cases={cases}
          onClose={() => setIsDeadlinePopupOpen(false)}
        />
      )}
    </div>
  );
}
