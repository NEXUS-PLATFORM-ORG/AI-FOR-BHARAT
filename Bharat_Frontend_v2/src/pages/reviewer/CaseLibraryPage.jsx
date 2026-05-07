import { useState, useRef, useEffect } from "react";
import {
  MagnifyingGlass, Faders, CaretLeft, CaretRight, DotsThree, CaretDown,
  X, FilePdf, MagnifyingGlassPlus, MagnifyingGlassMinus, Printer, Download, Warning, Database, CalendarBlank, ClipboardText, Brain
} from "@phosphor-icons/react";
import { AIResearchPage } from "./AIResearchPage";

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
        className="cursor-pointer bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-[#0F172A] focus:outline-none hover:border-slate-300 flex items-center justify-between gap-3 transition-colors"
      >
        <span className="truncate">{value}</span>
        <CaretDown size={14} weight="bold" className={`text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              className={`w-full text-left px-3 py-2 text-sm font-bold hover:bg-slate-50 hover:text-[#0F172A] transition-colors ${value === option ? 'text-[#0F172A] bg-slate-50 border-l-[3px] border-[#0F172A] pl-[9px]' : 'text-slate-600 border-l-[3px] border-transparent pl-[9px]'}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import { API_CASES as API_BASE } from "../../lib/apiConfig.js";

export function CaseLibraryPage() {
  const [sortValue, setSortValue] = useState("Deadline Urgency");
  const [filterValue, setFilterValue] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");

  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  const fetchCases = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(API_BASE);
      const data = await res.json();
      if (data.cases) setCases(data.cases);
    } catch (err) {
      console.error('Failed to fetch cases:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCases(); }, []);

  const openReviewModal = async (c) => {
    setSelectedCase(c);
    setIsReviewOpen(true);
    setActiveTab("details");
    setPdfPreviewUrl(null);
    setIsPdfLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${c.id}/signed-url`);
      const data = await res.json();
      setPdfPreviewUrl(data.signedUrl || null);
    } catch (err) {
      console.error('Failed to fetch signed URL:', err);
      setPdfPreviewUrl(null);
    } finally {
      setIsPdfLoading(false);
    }
  };

  const filteredAndSortedCases = cases.filter(c => {
    const matchesSearch =
      !debouncedSearchQuery ||
      (c.case_id && c.case_id.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      (c.department && c.department.toLowerCase().includes(debouncedSearchQuery.toLowerCase())) ||
      (c.court && c.court.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

    const matchesFilter = filterValue === "All Departments" || c.department === filterValue;

    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    if (sortValue === "Newest First") return new Date(b.created_at) - new Date(a.created_at);
    if (sortValue === "Highest Priority") {
      const pA = a.priority === "High" ? 2 : a.priority === "Medium" ? 1 : 0;
      const pB = b.priority === "High" ? 2 : b.priority === "Medium" ? 1 : 0;
      return pB - pA;
    }
    return new Date(a.deadline) - new Date(b.deadline);
  });

  // Dynamically derive unique departments from the fetched cases
  const departmentOptions = [
    "All Departments",
    ...Array.from(
      new Set(cases.map((c) => c.department).filter(Boolean))
    ).sort(),
  ];

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full">
      {/* List Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search by ID or Department"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-[#F8FAFC] border border-slate-200 focus:outline-none focus:border-slate-300 text-sm font-medium placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Sort:</span>
            <CustomDropdown
              value={sortValue}
              onChange={setSortValue}
              options={["Deadline Urgency", "Newest First", "Highest Priority"]}
              minWidth="160px"

            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-500">Filter:</span>
            <CustomDropdown
              value={filterValue}
              onChange={setFilterValue}
              options={departmentOptions}
              minWidth="150px"
            />
          </div>

        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-100 bg-white">
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">CASE ID</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">DEPARTMENT</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">COURT</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">JUDGMENT DATE</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider">STATUS</th>
                <th className="px-6 py-5 text-[11px] font-bold text-slate-500 uppercase tracking-wider text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                    Loading cases...
                  </td>
                </tr>
              ) : filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-10 text-center text-sm text-slate-500">
                    No cases match your filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((c) => {
                  let statusColor = "bg-[#F1F5F9] text-[#64748b]";
                  let statusDot = "bg-[#64748b]";

                  if (c.status === "APPROVED") {
                    statusColor = "bg-[#dcfce7] text-[#10b981]";
                    statusDot = "bg-[#10b981]";
                  } else if (c.status === "REJECTED") {
                    statusColor = "bg-[#fee2e2] text-[#ef4444]";
                    statusDot = "bg-[#ef4444]";
                  }

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="px-6 py-5 align-top">
                        <div className="font-bold text-[#334155] text-sm leading-tight">
                          {c.case_id}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <span className="inline-block px-2.5 py-1 bg-[#F1F5F9] text-[#64748b] text-[10px] font-bold tracking-wider uppercase mt-1">
                          {c.department}
                        </span>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-medium text-slate-500 leading-snug mt-1">
                          {c.court}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-medium text-slate-500 leading-snug mt-1">
                          {new Date(c.created_at).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${statusColor} text-[10px] font-bold tracking-wider mt-1 uppercase`}>
                          <div className={`h-1.5 w-1.5 rounded-full ${statusDot}`}></div>
                          {c.status}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-center">
                        <button
                          onClick={() => openReviewModal(c)}
                          className="px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-colors mt-1"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (Static for now) */}
        {!isLoading && filteredAndSortedCases.length > 0 && (
          <div className="border-t border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white">
            <p className="text-sm font-medium text-slate-500">Showing 1 to {filteredAndSortedCases.length} of {filteredAndSortedCases.length} results</p>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 flex items-center justify-center bg-[#0F172A] text-white text-sm font-bold">
                1
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {isReviewOpen && selectedCase && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white w-full h-full max-w-[1400px] flex flex-col shadow-2xl relative">
            <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-6 py-3 flex items-center gap-3 shrink-0">
              <Warning size={20} className="text-[#d97706]" weight="fill" />
              <span className="text-sm font-bold text-[#b45309]">Case Details Overview</span>
              <button onClick={() => setIsReviewOpen(false)} className="cursor-pointer ml-auto text-slate-400 hover:text-slate-600"><X size={20} weight="bold" /></button>
            </div>
            <div className="flex-1 flex min-h-0">
              {/* Left: PDF Preview */}
              <div className="w-1/2 bg-[#525659] flex flex-col border-r border-slate-200">
                <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-700"><FilePdf size={18} /> {selectedCase.file_path || 'Document.pdf'}</div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {isPdfLoading ? (
                    <div className="flex flex-col items-center justify-center h-full bg-[#525659] text-white gap-3">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm">Loading PDF...</p>
                    </div>
                  ) : pdfPreviewUrl ? (
                    <iframe src={pdfPreviewUrl} className="w-full h-full border-0" title="PDF Preview" />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-[#525659] text-white gap-3">
                      <p className="text-sm">PDF not available.</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Right: Tabs */}
              <div className="w-1/2 bg-white flex flex-col min-h-0">
                {/* Tab Bar */}
                <div className="flex border-b border-slate-200 shrink-0">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === "details"
                        ? "border-b-2 border-[#0F172A] text-[#0F172A]"
                        : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    <Database size={14} /> Case Details
                  </button>
                  <button
                    onClick={() => setActiveTab("ai")}
                    className={`px-6 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 ${activeTab === "ai"
                        ? "border-b-2 border-[#0F172A] text-[#0F172A]"
                        : "text-slate-400 hover:text-slate-600"
                      }`}
                  >
                    <Brain size={14} /> AI Research
                  </button>
                </div>

                {activeTab === "details" ? (
                  <>
                    <div className="p-8 overflow-y-auto flex-1">
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-[#0F172A] mb-1">Case Details</h2>
                          <p className="text-sm text-slate-500">System Analysis for {selectedCase.case_id}</p>
                        </div>
                        <div className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${selectedCase.priority === 'High' ? 'bg-[#fef2f2] text-[#991b1b]' : 'bg-[#f0fdf4] text-[#166534]'}`}>
                          <span className="text-slate-500 font-medium mr-1">RISK INDICATOR</span>
                          {selectedCase.priority === 'High' ? 'HIGH RISK' : 'LOW RISK'}
                        </div>
                      </div>
                      <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase mb-4"><Database size={16} /> EXTRACTED DATA</div>
                        <div className="space-y-4 border-b border-slate-100 pb-6">
                          <div><p className="text-xs font-bold text-slate-700 mb-1">Case ID</p><p className="text-sm text-[#0F172A]">{selectedCase.case_id}</p></div>
                          <div><p className="text-xs font-bold text-slate-700 mb-1">Court</p><p className="text-sm text-[#0F172A]">{selectedCase.court}</p></div>
                          <div className="bg-[#F8FAFC] border-l-2 border-slate-300 p-3 -mx-3"><p className="text-xs font-bold text-slate-700 mb-1">Department</p><p className="text-sm text-[#0F172A]">{selectedCase.department}</p></div>
                          <div className="bg-[#F8FAFC] border-l-2 border-slate-300 p-3 -mx-3"><p className="text-xs font-bold text-slate-700 mb-1">Deadline</p><p className="text-sm text-[#0F172A]">{new Date(selectedCase.deadline).toLocaleDateString()}</p></div>
                        </div>
                      </div>
                      <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase mb-4"><CalendarBlank size={16} /> DEADLINE CONFIRMATION</div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#F8FAFC] p-4 border border-slate-200"><p className="text-xs font-bold text-slate-600 mb-2">Upload Date</p><p className="text-[15px] text-[#0F172A]">{new Date(selectedCase.created_at).toLocaleDateString()}</p></div>
                          <div className="bg-[#0F172A] p-4 text-white shadow-sm"><p className="text-xs font-bold text-slate-300 mb-2">Target deadline</p><p className="text-[15px] font-semibold">{new Date(selectedCase.deadline).toLocaleDateString()}</p></div>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-slate-200 p-6 bg-white flex justify-end gap-3 shrink-0">
                      <button onClick={() => setIsReviewOpen(false)} className="px-6 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors cursor-pointer">Close View</button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 overflow-y-auto">
                    <AIResearchPage caseData={selectedCase} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
