import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardText,
  SealCheck,
  MagnifyingGlass,
  DownloadSimple,
  Brain,
  CaretDown,
  Warning,
  X,
} from "@phosphor-icons/react";
import { AIResearchPage } from "./AIResearchPage";
import { API_CASES } from "../../lib/apiConfig.js";

function CustomDropdown({ value, onChange, options, minWidth = "150px" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ minWidth }}
        className="cursor-pointer bg-white border border-slate-200 px-3 py-2 text-sm font-medium text-[#0F172A] focus:outline-none hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
      >
        <span className="truncate">{value}</span>
        <CaretDown
          size={14}
          weight="bold"
          className={`text-slate-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-slate-200 shadow-lg z-50 py-1">
          {options.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={`cursor-pointer w-full text-left px-3 py-2 text-sm font-medium hover:bg-slate-50 hover:text-[#0F172A] transition-colors ${value === option ? "text-[#0F172A] bg-slate-50 border-l-[3px] border-[#0F172A] pl-[9px]" : "text-slate-600 border-l-[3px] border-transparent pl-[9px]"}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function CaseTrackingPage() {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState("Status: All");
  const [deptFilter, setDeptFilter] = useState("Department: All");
  const [urgencyFilter, setUrgencyFilter] = useState("Urgency: All");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCase, setSelectedCase] = useState(null);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch(API_CASES);
        const data = await response.json();
        if (data.cases) {
          setCases(data.cases);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCases();
  }, []);

  const now = new Date();

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  const filteredCases = cases.filter(c => {
    const searchLower = debouncedSearchQuery.toLowerCase();
    const caseIdStr = (c.case_id || "").toLowerCase();
    const deptStr = (c.department || "").toLowerCase();
    const courtStr = (c.court || "").toLowerCase();

    const matchesSearch = !debouncedSearchQuery || 
      caseIdStr.includes(searchLower) ||
      deptStr.includes(searchLower) ||
      courtStr.includes(searchLower);
      
    const statusVal = statusFilter.replace("Status: ", "");
    const statusStr = (c.status || "").toLowerCase();
    const matchesStatus = statusVal === "All" || 
      (statusVal === "Pending Review" && statusStr.includes("pending")) || 
      (statusVal === "Verified" && (statusStr === "verified" || statusStr === "finalized" || statusStr === "completed"));

    const deptVal = deptFilter.replace("Department: ", "");
    const matchesDept = deptVal === "All" || deptStr.includes(deptVal.toLowerCase());

    const urgencyVal = urgencyFilter.replace("Urgency: ", "");
    const priorityStr = (c.priority || "").toLowerCase();
    const matchesUrgency = urgencyVal === "All" || 
      (urgencyVal === "High" && priorityStr === "high") ||
      (urgencyVal === "Low" && priorityStr !== "high");

    return matchesSearch && matchesStatus && matchesDept && matchesUrgency;
  });

  const pendingCount = cases.filter(c => (c.status || "").toLowerCase().includes("pending")).length;
  const urgentCount = cases.filter(c => (c.priority || "").toLowerCase() === "high").length;
  const verifiedCount = cases.filter(c => {
    const s = (c.status || "").toLowerCase();
    return s === "verified" || s === "finalized" || s === "completed";
  }).length;

  // Dynamically derive unique departments from the fetched cases
  const departmentOptions = [
    "Department: All",
    ...Array.from(
      new Set(cases.map((c) => c.department).filter(Boolean))
    ).sort(),
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc]">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#0F172A] mb-2">
          Case Tracking
        </h1>
        <p className="text-sm text-slate-500">
          Monitor case progress and required actions through the centralized
          administration portal.
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Pending Review */}
        <div className="bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-slate-200">
          <div>
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1">
              PENDING REVIEW
            </p>
            <p className="text-3xl font-black text-[#0F172A]">{pendingCount}</p>
          </div>
          <ClipboardText
            size={32}
            className="text-slate-300"
            weight="duotone"
          />
        </div>

        {/* Urgent Cases */}
        <div className="bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-[#dc2626]">
          <div>
            <p className="text-[11px] font-bold text-[#dc2626] tracking-wider uppercase mb-1">
              URGENT CASES
            </p>
            <p className="text-3xl font-black text-[#dc2626]">{urgentCount}</p>
          </div>
          <div className="text-[#fca5a5] flex flex-col items-center justify-center font-black text-[32px] leading-none">
            !
          </div>
        </div>

        {/* Verified Cases */}
        <div className="bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-slate-200">
          <div>
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1">
              VERIFIED CASES
            </p>
            <p className="text-3xl font-black text-[#0F172A]">{verifiedCount}</p>
          </div>
          <SealCheck size={32} className="text-slate-300" weight="duotone" />
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-8">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4 flex-1">
            <div className="relative max-w-sm w-full sm:w-auto">
              <MagnifyingGlass
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Filter by Case ID or Dept..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 w-full sm:w-64 border border-slate-200 focus:outline-none focus:border-slate-300 text-sm placeholder:text-slate-400"
              />
            </div>

            <div className="flex items-center gap-2">
              <CustomDropdown
                value={statusFilter}
                onChange={setStatusFilter}
                options={["Status: All", "Pending Review", "Verified"]}
                minWidth="140px"
              />
            </div>
            <div className="flex items-center gap-2">
              <CustomDropdown
                value={deptFilter}
                onChange={setDeptFilter}
                options={departmentOptions}
                minWidth="150px"
              />
            </div>
            <div className="flex items-center gap-2">
              <CustomDropdown
                value={urgencyFilter}
                onChange={setUrgencyFilter}
                options={["Urgency: All", "High", "Low"]}
                minWidth="140px"
              />
            </div>
          </div>

          <button className="flex items-center gap-2 text-sm font-bold text-[#0F172A] hover:text-slate-700 transition-colors cursor-pointer">
            <DownloadSimple size={16} weight="bold" /> Export Report
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc]">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  CASE ID
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  COURT
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  DECISION
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  DEPT.
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  DEADLINE
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center">
                  URGENCY
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  REQUIRED ACTION
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan="9" className="px-6 py-10 text-center text-sm text-slate-500">
                    {isLoading ? "Loading cases..." : "No cases match your filters."}
                  </td>
                </tr>
              ) : (
                filteredCases.map(c => {
                  const daysRemaining = c.deadline ? Math.ceil((new Date(c.deadline) - now) / (1000 * 60 * 60 * 24)) : null;
                  const isOverdue = daysRemaining !== null && daysRemaining < 0;
                  const urgencyColorClass = (c.priority || "").toLowerCase() === "high" || isOverdue ? "bg-[#dc2626]" : ((c.priority || "").toLowerCase() === "low" ? "bg-slate-300" : "bg-[#f59e0b]");
                  const statusStr = (c.status || "UNKNOWN").toUpperCase();

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 align-top">
                        <div className="font-bold text-[#0F172A] text-sm leading-snug">{c.case_id || "N/A"}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm text-slate-600 leading-snug">{c.court || "N/A"}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase border ${
                          statusStr.includes("PENDING") || statusStr.includes("REVIEW") ? "bg-[#fffbeb] text-[#d97706] border-[#fde68a]" :
                          statusStr.includes("FINAL") || statusStr.includes("VERIFIED") ? "bg-[#ecfdf5] text-[#059669] border-[#a7f3d0]" :
                          "bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]"
                        }`}>{statusStr}</span>
                      </td>
                      <td className="px-6 py-5 align-top">
                         <span className="inline-block px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-[9px] font-bold tracking-wider uppercase border border-slate-200">
                           {c.decision_date ? "DECIDED" : "PENDING"}
                         </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm text-slate-600">{c.department || "General"}</div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm text-[#0F172A] mb-1">{formatDate(c.deadline)}</div>
                        {daysRemaining !== null && daysRemaining <= 7 && !isOverdue && (
                          <div className="text-[9px] font-bold text-[#dc2626] uppercase">{daysRemaining}D REMAINING</div>
                        )}
                        {isOverdue && (
                          <div className="text-[9px] font-bold text-[#dc2626] uppercase">OVERDUE</div>
                        )}
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <div className={`w-2 h-2 rounded-full ${urgencyColorClass} mx-auto mt-1`}></div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm text-slate-600">Review Required</div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <button
                          onClick={() => setSelectedCase(c)}
                          className="text-[11px] font-bold text-[#0F172A] hover:underline uppercase tracking-wider mt-1 cursor-pointer"
                        >
                          OPEN
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <p className="text-xs text-slate-500">Showing 1-{filteredCases.length} of {filteredCases.length} cases</p>
          <div className="flex gap-2">
            <button
              className="px-4 py-2 border border-slate-200 bg-white text-slate-400 text-sm font-medium hover:bg-slate-50 transition-colors disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <button className="px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-sm font-medium hover:bg-slate-50 transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>

      {/* AI Research Modal */}
      {selectedCase && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white w-full h-full max-w-[1400px] flex flex-col shadow-2xl relative border border-slate-200">
            <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-6 py-3 flex items-center gap-3 shrink-0">
              <Warning size={20} className="text-[#d97706]" weight="fill" />
              <span className="text-sm font-bold text-[#b45309]">
                AI Research — {selectedCase.case_id}
              </span>
              <button
                onClick={() => setSelectedCase(null)}
                className="cursor-pointer ml-auto text-[#d97706] hover:text-[#b45309] transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <AIResearchPage caseData={selectedCase} />
            </div>
          </div>
        </div>
      )}

      {/* Insight Box */}
      <div className="bg-white border border-slate-200 shadow-sm p-6 lg:p-8 border-l-[3px] border-l-[#0F172A] flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Brain size={20} weight="bold" />
          <h3 className="font-bold text-lg text-[#0F172A]">
            Administrative AI Insight
          </h3>
        </div>
        <p className="text-[15px] text-slate-600 leading-relaxed max-w-5xl">
          Our predictive engine indicates a high probability of bottleneck in
          the{" "}
          <span className="font-bold text-[#0F172A]">Revenue Department</span>{" "}
          filings due to the upcoming Supreme Court session. It is recommended
          to prioritize human verification for cases marked{" "}
          <span className="font-bold text-[#dc2626]">#VS-2024-0891</span> and{" "}
          <span className="font-bold text-[#dc2626]">#VS-2024-0912</span> to
          maintain compliance timelines.
        </p>
        <div className="flex items-center gap-3 mt-2">
          <button className="px-5 py-2.5 bg-[#0F172A] text-white text-xs font-bold hover:bg-slate-800 transition-colors">
            View Strategy Plan
          </button>
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-colors">
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
