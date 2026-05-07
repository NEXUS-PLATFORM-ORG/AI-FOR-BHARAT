import { useState, useRef, useEffect } from "react";
import {
  ClipboardText,
  CalendarBlank,
  MagnifyingGlass,
  Faders,
  CloudArrowUp,
  MagicWand,
  Warning,
  X,
  FilePdf,
  MagnifyingGlassPlus,
  MagnifyingGlassMinus,
  Printer,
  Download,
  Database,
  CaretLeft,
  CaretRight,
  Brain,
  ShieldWarning,
  Microscope,
  Clock,
  ArrowsLeftRight,
  Eye,
  ArrowRight,
  CaretDoubleRight,
  CheckCircle,
  CaretDown,
} from "@phosphor-icons/react";
import { AIResearchPage } from "./AIResearchPage";

const AIResearchPanel = ({ c, onBack }) => (
  <div className="flex flex-col h-full bg-white relative">
    <button onClick={onBack} className="absolute top-4 right-4 z-10 px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border border-slate-300 flex items-center gap-2 cursor-pointer">
      <CaretLeft size={16} /> Back to Verification
    </button>
    <div className="flex-1 overflow-y-auto mt-12">
      <AIResearchPage caseData={c} />
    </div>
  </div>
);

function CustomDropdown({ value, onChange, options, minWidth = "150px" }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target))
        setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{ minWidth }}
        className="bg-white border border-slate-200 px-3 py-2 text-sm font-bold text-[#0F172A] focus:outline-none hover:border-slate-300 flex items-center justify-between gap-3 transition-colors cursor-pointer"
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
              className={`w-full text-left px-3 py-2 text-sm font-bold hover:bg-slate-50 hover:text-[#0F172A] transition-colors cursor-pointer ${value === option ? "text-[#0F172A] bg-slate-50 border-l-[3px] border-[#0F172A] pl-[9px]" : "text-slate-600 border-l-[3px] border-transparent pl-[9px]"}`}
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

export function DashboardPage() {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showActionPlan, setShowActionPlan] = useState(false);
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [sortValue, setSortValue] = useState("Deadline Urgency");
  const [filterValue, setFilterValue] = useState("All Departments");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const calendarRef = useRef(null);

  const [isDeadlinePopupOpen, setIsDeadlinePopupOpen] = useState(false);
  const [deadlineStep, setDeadlineStep] = useState(1);
  const [selectedDeadlineCase, setSelectedDeadlineCase] = useState("");

  const [hasReadAIResearch, setHasReadAIResearch] = useState(false);
  const aiResearchScrollRef = useRef(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPlan, setEditedPlan] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    function handleClickOutsideCal(event) {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutsideCal);
    return () => document.removeEventListener("mousedown", handleClickOutsideCal);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const handleSaveActionPlan = async () => {
    if (!selectedCase || !editedPlan) return;
    try {
      setIsSaving(true);
      const res = await fetch(`${API_BASE}/${selectedCase.id}/action-plan`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editedPlan),
      });
      if (res.ok) {
        setIsEditMode(false);
        await fetchCases();
      } else {
        const d = await res.json();
        alert(`Save failed: ${d.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to save action plan.");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchCases = async () => {
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
  };

  useEffect(() => {
    fetchCases();
  }, []);

  const handleUploadClick = () => fileInputRef.current?.click();
  const handleFileChange = (e) => {
    if (e.target.files?.length > 0) setSelectedFile(e.target.files[0]);
  };

  const handleProcessCase = async () => {
    if (!selectedFile) return;
    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        await fetchCases();
        setSelectedFile(null);
      } else {
        const d = await res.json();
        alert(`Upload failed: ${d.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleStatusUpdate = async (status) => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`${API_BASE}/${selectedCase.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        await fetchCases();
        setIsReviewOpen(false);
        setSelectedCase(null);
      } else {
        const d = await res.json();
        alert(`Failed: ${d.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to update status.");
    }
  };

  const openReviewModal = async (c) => {
    setSelectedCase(c);
    setIsReviewOpen(true);
    setPdfPreviewUrl(null);
    setIsPdfLoading(true);
    setShowActionPlan(false);
    setHasReadAIResearch(false);
    setIsEditMode(false);
    setEditedPlan(null);
    try {
      const res = await fetch(`${API_BASE}/${c.id}/signed-url`);
      const data = await res.json();
      setPdfPreviewUrl(data.signedUrl || null);
    } catch {
      setPdfPreviewUrl(null);
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Compute stats from real data
  const pendingCount = cases.filter(
    (c) => c.status === "PENDING REVIEW",
  ).length;
  const urgentCount = cases.filter((c) => c.priority === "High").length;
  const upcomingCount = cases.filter(
    (c) =>
      new Date(c.deadline) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  ).length;

  // Dynamically derive unique departments from the fetched cases
  const departmentOptions = [
    "All Departments",
    ...Array.from(
      new Set(cases.map((c) => c.department).filter(Boolean))
    ).sort(),
  ];

  const filteredAndSortedCases = cases
    .filter((c) => {
      const matchesSearch =
        !debouncedSearchQuery ||
        (c.case_id &&
          c.case_id
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())) ||
        (c.department &&
          c.department
            .toLowerCase()
            .includes(debouncedSearchQuery.toLowerCase())) ||
        (c.court &&
          c.court.toLowerCase().includes(debouncedSearchQuery.toLowerCase()));

      const matchesFilter =
        filterValue === "All Departments" || c.department === filterValue;

      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      if (sortValue === "Newest First")
        return new Date(b.created_at) - new Date(a.created_at);
      if (sortValue === "Highest Priority") {
        const pA = a.priority === "High" ? 2 : a.priority === "Medium" ? 1 : 0;
        const pB = b.priority === "High" ? 2 : b.priority === "Medium" ? 1 : 0;
        return pB - pA;
      }
      return new Date(a.deadline) - new Date(b.deadline);
    });

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1));
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1));
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdueDates = new Set();
  const approachingDates = new Set();

  cases.forEach((c) => {
    if (c.deadline) {
      const d = new Date(c.deadline);
      d.setHours(0, 0, 0, 0);
      if (d < today && c.status !== "APPROVED" && c.status !== "COMPLETED") {
        overdueDates.add(d.getTime());
      } else if (d <= new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000) && c.status !== "APPROVED" && c.status !== "COMPLETED") {
        approachingDates.add(d.getTime());
      }
    }
  });
  


  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc]">
      {/* Upload Judgment Field */}
      <div
        className="mb-8 border-2 border-dashed border-slate-300 bg-white p-8 md:p-12 flex flex-col items-center justify-center gap-4 hover:border-slate-400 hover:bg-slate-50 transition-all cursor-pointer group shadow-sm"
        onClick={handleUploadClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          className="hidden"
        />
        <div className="w-16 h-16 bg-[#F8FAFC] border border-slate-200 flex items-center justify-center text-slate-500 group-hover:scale-105 transition-transform">
          {selectedFile ? (
            <FilePdf size={32} weight="fill" className="text-[#dc2626]" />
          ) : (
            <CloudArrowUp size={32} weight="duotone" />
          )}
        </div>
        <div className="text-center">
          <h2 className="text-lg font-bold text-[#0F172A] mb-1">
            {selectedFile
              ? selectedFile.name
              : "Drag and drop PDF judgment here"}
          </h2>
          <p className="text-sm font-medium text-slate-500">
            {selectedFile
              ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB`
              : "Max file size 50MB. Secure legal document upload."}
          </p>
        </div>
        <div
          className="flex flex-col sm:flex-row items-center gap-3 mt-4 w-full sm:w-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleUploadClick}
            className="w-full sm:w-auto px-6 py-2.5 bg-white border border-slate-200 text-[#0F172A] text-[13px] font-bold tracking-wide hover:bg-slate-50 cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            {selectedFile ? "Change File" : "Browse Files"}
          </button>
          <button
            onClick={handleProcessCase}
            disabled={!selectedFile || isUploading}
            className="w-full sm:w-auto px-6 py-2.5 bg-[#0F172A] text-white text-[13px] font-bold tracking-wide hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-sm"
          >
            <MagicWand size={16} weight="bold" />{" "}
            {isUploading ? "Processing..." : "Process Case"}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-slate-200 shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
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

        <div className="bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-[#dc2626] shadow-sm hover:border-slate-300 transition-colors cursor-pointer">
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

        <div 
          onClick={() => { setIsDeadlinePopupOpen(true); setDeadlineStep(1); setSelectedDeadlineCase(""); }}
          className="relative bg-white p-6 flex justify-between items-center border border-slate-200 border-l-[3px] border-l-slate-200 shadow-sm hover:border-slate-300 transition-colors cursor-pointer"
        >
          <div>
            <p className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-1">
              UPCOMING DEADLINES
            </p>
            <div className="flex items-end gap-2">
              <p className="text-3xl font-black text-[#0F172A] leading-none">
                {upcomingCount}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Next 7 days
              </p>
            </div>
          </div>
          <CalendarBlank
            size={32}
            className="text-slate-300"
            weight="duotone"
          />
        </div>
      </div>

      {/* List Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
        <div className="relative flex-1">
          <MagnifyingGlass
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <input
            type="text"
            placeholder="Search by ID or Department"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-full bg-white border border-slate-200 focus:outline-none focus:border-slate-300 text-sm font-medium placeholder:text-slate-400 shadow-sm"
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
      <div className="bg-white border border-slate-200 shadow-sm overflow-hidden mb-8">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-[#f8fafc]">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  CASE ID
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  DEPARTMENT
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  COURT
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  DEADLINE
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  PRIORITY
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  STATUS
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider text-right">
                  ACTION
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    Loading cases...
                  </td>
                </tr>
              ) : filteredAndSortedCases.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-10 text-center text-sm text-slate-500"
                  >
                    No cases match your filters.
                  </td>
                </tr>
              ) : (
                filteredAndSortedCases.map((c) => {
                  const isUrgent =
                    new Date(c.deadline) <=
                    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
                  const statusColor =
                    c.status === "APPROVED"
                      ? "bg-[#dcfce7] text-[#166534]"
                      : c.status === "REJECTED"
                        ? "bg-[#fee2e2] text-[#991b1b]"
                        : "bg-[#F1F5F9] text-[#64748b]";
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
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
                        <div className="mt-1">
                          <div
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase ${isUrgent ? "bg-[#fee2e2] text-[#991b1b]" : "bg-[#dcfce7] text-[#166534]"}`}
                          >
                            <div
                              className={`h-1.5 w-1.5 rounded-full ${isUrgent ? "bg-[#dc2626]" : "bg-[#16a34a]"}`}
                            ></div>
                            {new Date(c.deadline).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div className="text-sm font-bold text-[#0F172A] mt-1">
                          {c.priority}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold tracking-wider uppercase mt-1 ${statusColor}`}
                        >
                          {c.status}
                        </div>
                      </td>
                      <td className="px-6 py-5 align-top text-right">
                        <button
                          onClick={() => openReviewModal(c)}
                          className="px-4 py-2 border border-slate-200 bg-white text-[#0F172A] text-xs font-bold hover:bg-slate-50 transition-colors mt-1 cursor-pointer"
                        >
                          Review
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

      {/* Review Modal */}
      {isReviewOpen && selectedCase && (
        <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 md:p-8">
          <div className="bg-white w-full h-full max-w-[1400px] flex flex-col shadow-2xl relative border border-slate-200">
            <div className="bg-[#fffbeb] border-b border-[#fef3c7] px-6 py-3 flex items-center gap-3 shrink-0">
              <Warning size={20} className="text-[#d97706]" weight="fill" />
              <span className="text-sm font-bold text-[#b45309]">
                Review Incomplete: Check extracted fields for accuracy.
              </span>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="cursor-pointer ml-auto text-[#d97706] hover:text-[#b45309] transition-colors"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            <div className="flex-1 flex min-h-0">
              {/* Left: PDF Preview */}
              <div className="w-1/2 bg-[#525659] flex flex-col border-r border-slate-200">
                <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0">
                  <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                    <FilePdf size={18} className="text-[#dc2626]" />{" "}
                    {selectedCase.file_path || "Document.pdf"}
                  </div>
                  <div className="flex items-center gap-4 text-slate-600">
                    <Printer size={16} className="cursor-pointer hover:text-slate-900 transition-colors" />
                    <Download size={16} className="cursor-pointer hover:text-slate-900 transition-colors" />
                  </div>
                </div>
                <div className="flex-1 overflow-hidden">
                  {isPdfLoading ? (
                    <div className="flex flex-col items-center justify-center h-full bg-[#525659] text-white gap-3">
                      <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-medium">Loading PDF...</p>
                    </div>
                  ) : pdfPreviewUrl ? (
                    <iframe
                      src={pdfPreviewUrl}
                      className="w-full h-full border-0"
                      title="PDF Preview"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full bg-[#525659] text-white gap-3">
                      <p className="text-sm font-medium">PDF not available.</p>
                    </div>
                  )}
                </div>
              </div>
              {/* Right: Insights */}
              <div className="w-1/2 bg-white flex flex-col min-h-0">
                <div
                  ref={aiResearchScrollRef}
                  className="p-8 overflow-y-auto flex-1"
                  onScroll={(e) => {
                    if (!showActionPlan) return;
                    const el = e.currentTarget;
                    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
                    if (nearBottom) setHasReadAIResearch(true);
                  }}
                >
                  {!showActionPlan ? (
                    <>
                      <div className="flex justify-between items-start mb-8">
                        <div>
                          <h2 className="text-2xl font-bold text-[#0F172A] mb-1">
                            Case Verification
                          </h2>
                          <p className="text-sm text-slate-500 font-medium">
                            System Analysis for {selectedCase.case_id}
                          </p>
                        </div>
                        <div
                          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${selectedCase.priority === "High" ? "bg-[#fef2f2] text-[#991b1b]" : "bg-[#f0fdf4] text-[#166534]"}`}
                        >
                          <span className="text-slate-500 font-medium mr-1">
                            RISK INDICATOR
                          </span>
                          {selectedCase.priority === "High"
                            ? "HIGH RISK"
                            : "LOW RISK"}
                        </div>
                      </div>
                      <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">
                          <Database size={16} /> EXTRACTED DATA
                        </div>
                        <div className="space-y-4 border-b border-slate-100 pb-6">
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Case ID
                            </p>
                            <p className="text-sm font-medium text-[#0F172A]">
                              {selectedCase.case_id}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Court
                            </p>
                            <p className="text-sm font-medium text-[#0F172A]">
                              {selectedCase.court}
                            </p>
                          </div>
                          <div className="bg-[#fffbeb] border-l-2 border-[#fcd34d] p-3 -mx-3">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Department
                            </p>
                            <p className="text-sm font-medium text-[#0F172A]">
                              {selectedCase.department}
                            </p>
                          </div>
                          <div className="bg-[#fffbeb] border-l-2 border-[#fcd34d] p-3 -mx-3">
                            <p className="text-xs font-bold text-slate-700 mb-1">
                              Deadline
                            </p>
                            <p className="text-sm font-medium text-[#0F172A]">
                              {new Date(
                                selectedCase.deadline,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mb-8">
                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 tracking-widest uppercase mb-4">
                          <CalendarBlank size={16} /> DEADLINE CONFIRMATION
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-[#F8FAFC] p-4 border border-slate-200">
                            <p className="text-xs font-bold text-slate-600 mb-2">
                              Upload Date
                            </p>
                            <p className="text-[15px] text-[#0F172A] font-bold">
                              {new Date(
                                selectedCase.created_at,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="bg-[#0F172A] p-4 text-white shadow-sm">
                            <p className="text-xs font-bold text-slate-300 mb-2">
                              Target deadline
                            </p>
                            <p className="text-[15px] font-bold">
                              {new Date(
                                selectedCase.deadline,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="mt-8">
                        <button
                          onClick={() => {
                            setShowActionPlan(true);
                            setHasReadAIResearch(false);
                            // reset scroll so detection triggers fresh
                            setTimeout(() => {
                              if (aiResearchScrollRef.current) aiResearchScrollRef.current.scrollTop = 0;
                            }, 50);
                          }}
                          className="w-full py-4 border-2 border-dashed border-slate-300 text-slate-600 font-bold text-sm hover:border-slate-400 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Brain size={18} /> View AI Research
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setShowActionPlan(false)}
                        className="mb-8 flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#0F172A] transition-colors cursor-pointer w-fit"
                      >
                        <CaretLeft size={16} weight="bold" /> Back to Review
                      </button>

                      <div className="mb-8">
                        <h2 className="text-2xl font-bold text-[#0F172A] mb-1">
                          Judgment Intelligence Report
                        </h2>
                        <p className="text-sm text-slate-500 font-medium">
                          Deep neural analysis for {selectedCase.case_id}. This
                          system prioritizes operative directives through
                          institutional semantic modeling.
                        </p>
                      </div>

                      <div className="flex flex-col gap-6">
                        {/* Legal Semantic Understanding */}
                        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
                          <div className="flex items-center gap-2 mb-6">
                            <Brain size={20} weight="bold" />
                            <h2 className="text-lg font-bold text-[#0F172A]">
                              Legal Semantic Understanding
                            </h2>
                          </div>

                          <div className="space-y-4 flex-1">
                            {/* Row 1 */}
                            <div className="bg-[#F8FAFC] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  SOURCE PHRASE
                                </p>
                                <p className="font-mono text-sm text-[#0F172A]">
                                  "shall be liable to penalty"
                                </p>
                              </div>
                              <ArrowRight
                                size={16}
                                className="text-slate-300 hidden xl:block shrink-0 mx-4"
                              />
                              <div className="flex-1 xl:text-right flex flex-col xl:items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  AI SEMANTIC MAPPING
                                </p>
                                <span className="inline-block px-3 py-1 bg-[#ecfdf5] text-[#059669] text-xs font-bold w-fit">
                                  Strict Liability
                                </span>
                              </div>
                            </div>

                            {/* Row 2 */}
                            <div className="bg-[#F8FAFC] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  SOURCE PHRASE
                                </p>
                                <p className="font-mono text-sm text-[#0F172A]">
                                  "within a period of 4 weeks"
                                </p>
                              </div>
                              <ArrowRight
                                size={16}
                                className="text-slate-300 hidden xl:block shrink-0 mx-4"
                              />
                              <div className="flex-1 xl:text-right flex flex-col xl:items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  AI SEMANTIC MAPPING
                                </p>
                                <span className="inline-block px-3 py-1 bg-[#fffbeb] text-[#d97706] text-xs font-bold w-fit">
                                  Fixed Compliance Window
                                </span>
                              </div>
                            </div>

                            {/* Row 3 */}
                            <div className="bg-[#F8FAFC] p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  SOURCE PHRASE
                                </p>
                                <p className="font-mono text-sm text-[#0F172A]">
                                  "it is desired that..."
                                </p>
                              </div>
                              <ArrowRight
                                size={16}
                                className="text-slate-300 hidden xl:block shrink-0 mx-4"
                              />
                              <div className="flex-1 xl:text-right flex flex-col xl:items-end">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                                  AI SEMANTIC MAPPING
                                </p>
                                <span className="inline-block px-3 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-bold w-fit">
                                  Directory Directive
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Risk Scoring Model */}
                        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
                          <div className="flex items-center gap-2 mb-8">
                            <ShieldWarning size={20} weight="bold" />
                            <h2 className="text-lg font-bold text-[#0F172A]">
                              Risk Scoring Model
                            </h2>
                          </div>

                          <div className="flex flex-col items-center justify-center mb-12">
                            <div className="relative w-32 h-32 flex items-center justify-center">
                              <svg
                                className="absolute inset-0 w-full h-full transform -rotate-90"
                                viewBox="0 0 128 128"
                              >
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  fill="transparent"
                                  stroke="#f1f5f9"
                                  strokeWidth="8"
                                />
                                <circle
                                  cx="64"
                                  cy="64"
                                  r="56"
                                  fill="transparent"
                                  stroke="#0F172A"
                                  strokeWidth="8"
                                  strokeDasharray="351.85"
                                  strokeDashoffset="63.33"
                                />
                              </svg>
                              <div className="text-center z-10 flex flex-col items-center justify-center mt-1">
                                <span className="block text-[42px] font-black text-[#0F172A] leading-none mb-1">
                                  82
                                </span>
                                <span className="block text-[9px] font-bold text-slate-400 tracking-widest uppercase">
                                  HIGH RISK
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-5 px-1 mt-auto pb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">
                                Deadline Urgency
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100">
                                <div
                                  className="h-full bg-[#0F172A]"
                                  style={{ width: "90%" }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-[#0F172A] w-6 text-right shrink-0">
                                9.0
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">
                                Directive Strength
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100">
                                <div
                                  className="h-full bg-[#0F172A]"
                                  style={{ width: "75%" }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-[#0F172A] w-6 text-right shrink-0">
                                7.5
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">
                                Extraction Confidence
                              </span>
                              <div className="flex-1 h-1.5 bg-slate-100">
                                <div
                                  className="h-full bg-[#0F172A]"
                                  style={{ width: "95%" }}
                                ></div>
                              </div>
                              <span className="text-xs font-bold text-[#0F172A] w-6 text-right shrink-0">
                                9.5
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Operative Section Detection */}
                        <div className="bg-white border border-slate-200 shadow-sm p-6">
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                              <Microscope size={20} weight="bold" />
                              <h2 className="text-lg font-bold text-[#0F172A]">
                                Operative Section Detection
                              </h2>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                              <span className="text-[10px] font-bold text-[#10b981] tracking-wider uppercase hidden sm:block">
                                Active Synthesis
                              </span>
                            </div>
                          </div>

                          <div className="bg-[#f8fafc] p-6 font-mono text-sm leading-relaxed border border-slate-100">
                            <p className="text-slate-400 mb-4">
                              ...the court having heard the learned counsel for
                              the parties and having perused the records is of
                              the opinion that...
                            </p>

                            <div className="relative border-2 border-[#0F172A] p-5 my-6 bg-white shadow-sm">
                              <div className="absolute -top-3 left-4 bg-[#0F172A] text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase">
                                FOCUS: PRIMARY DIRECTIVE
                              </div>
                              <p className="font-bold text-[#0F172A]">
                                "THE RESPONDENTS ARE DIRECTED TO CONSIDER THE
                                REPRESENTATION FILED BY THE PETITIONER DATED
                                12.10.2023 AND PASS A REASONED ORDER WITHIN
                                THIRTY DAYS."
                              </p>
                            </div>

                            <p className="text-slate-400">
                              ...it is further clarified that this court has not
                              expressed any opinion on the merits of the case
                              and the matter is left open to the competent
                              authority...
                            </p>
                          </div>
                        </div>

                        {/* Timeline Inference */}
                        <div className="bg-white border border-slate-200 shadow-sm p-6">
                          <div className="flex items-center gap-2 mb-8">
                            <Clock size={20} weight="bold" />
                            <h2 className="text-lg font-bold text-[#0F172A]">
                              Timeline Inference
                            </h2>
                          </div>

                          <div className="relative space-y-6">
                            <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-slate-200"></div>

                            <div className="relative flex gap-4">
                              <div className="w-3 h-3 bg-[#0F172A] rounded-full ring-4 ring-white mt-1 shrink-0 z-10"></div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  START (T0)
                                </p>
                                <p className="font-bold text-[#0F172A] mb-0.5">
                                  Nov 24, 2023
                                </p>
                                <p className="text-xs text-slate-500 italic">
                                  Inferred from: "From the date of this order"
                                </p>
                              </div>
                            </div>

                            <div className="relative flex gap-4">
                              <div className="w-3 h-3 bg-[#f59e0b] rounded-full ring-4 ring-white mt-1 shrink-0 z-10"></div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  INTERMEDIATE REVIEW
                                </p>
                                <p className="font-bold text-[#0F172A] mb-0.5">
                                  Dec 08, 2023
                                </p>
                                <p className="text-xs text-slate-500 italic">
                                  Inferred: 14 Day Internal Milestone
                                </p>
                              </div>
                            </div>

                            <div className="relative flex gap-4">
                              <div className="w-3 h-3 bg-[#ef4444] rounded-full ring-4 ring-white mt-1 shrink-0 z-10"></div>
                              <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                  DEADLINE (T0 + 30)
                                </p>
                                <p className="font-bold text-[#0F172A] mb-0.5">
                                  Dec 24, 2023
                                </p>
                                <p className="text-xs text-slate-500 italic">
                                  Extracted: "within thirty days"
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Context-Aware Extraction */}
                        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
                          <div className="flex items-center gap-2 mb-6">
                            <Eye size={20} weight="bold" />
                            <h2 className="text-lg font-bold text-[#0F172A]">
                              Context-Aware Extraction
                            </h2>
                          </div>

                          <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="flex-1 bg-[#fef2f2] border border-[#fecaca] p-5 w-full h-full flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-wider mb-3">
                                  LINEAR KEYWORD SEARCH
                                </p>
                                <p className="text-sm text-slate-700 italic mb-4">
                                  "Detected 'Penalty' - Flagged as Immediate
                                  Financial Risk."
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#b91c1c] text-xs font-bold">
                                <X size={14} weight="bold" />
                                High False Positive
                              </div>
                            </div>

                            <div className="text-slate-300 hidden md:block">
                              <CaretDoubleRight size={24} weight="bold" />
                            </div>

                            <div className="flex-1 bg-[#ecfdf5] border border-[#a7f3d0] p-5 w-full h-full flex flex-col justify-between">
                              <div>
                                <p className="text-[10px] font-bold text-[#047857] uppercase tracking-wider mb-3">
                                  NEURAL CONTEXT ANALYSIS
                                </p>
                                <p className="text-sm text-slate-700 italic mb-4">
                                  "'Penalty' context: Hypothetical future
                                  warning. Not an operative order for current
                                  case."
                                </p>
                              </div>
                              <div className="flex items-center gap-1.5 text-[#047857] text-xs font-bold">
                                <CheckCircle size={14} weight="bold" />
                                Correct Inference
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="-mx-4 md:-mx-8 -mt-4">
                        <AIResearchPage
                          caseData={selectedCase}
                          editMode={isEditMode}
                          editedPlan={editedPlan}
                          setEditedPlan={setEditedPlan}
                        />
                      </div>
                    </>
                  )}
                </div>
                <div className="border-t border-slate-200 p-6 bg-white flex justify-between items-center shrink-0">
                  <div className="flex items-center gap-2">
                    {isEditMode && (
                      <span className="text-xs font-bold text-[#d97706] bg-[#fffbeb] border border-[#fde68a] px-2.5 py-1">
                        ✏ Editing AI Research Plan
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleStatusUpdate("REJECTED")}
                      className="cursor-pointer px-6 py-2.5 text-sm font-bold text-[#dc2626] border border-transparent hover:bg-red-50 hover:border-red-200 transition-colors"
                    >
                      Reject
                    </button>
                    {isEditMode ? (
                      <>
                        <button
                          onClick={() => { setIsEditMode(false); setEditedPlan(null); }}
                          className="cursor-pointer px-6 py-2.5 border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveActionPlan}
                          disabled={isSaving}
                          className="cursor-pointer px-6 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {isSaving ? "Saving..." : "Save Changes"}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          const ap = selectedCase?.extracted_data?.action_plan ||
                            selectedCase?.extracted_data?.extracted_data?.action_plan || {};
                          setEditedPlan({
                            summary_directive: ap.summary_directive || "",
                            priority: ap.priority || "Low",
                            status: ap.status || "COMPLIANCE_REQUIRED",
                            departments_involved: ap.departments_involved || [],
                            tasks: (ap.tasks || []).map((t, i) => ({ ...t, step: t.step || i + 1 })),
                          });
                          setIsEditMode(true);
                          if (!showActionPlan) setShowActionPlan(true);
                        }}
                        className="cursor-pointer px-6 py-2.5 border border-slate-300 bg-white text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        Edit
                      </button>
                    )}
                    <div className="relative group">
                    <button
                      onClick={() => handleStatusUpdate("APPROVED")}
                      disabled={!hasReadAIResearch}
                      className={`px-6 py-2.5 text-sm font-bold transition-colors ${
                        hasReadAIResearch
                          ? "cursor-pointer bg-[#0F172A] text-white hover:bg-slate-800"
                          : "cursor-not-allowed bg-slate-200 text-slate-400"
                      }`}
                    >
                      Approve
                    </button>
                    {!hasReadAIResearch && (
                      <div className="absolute bottom-full right-0 mb-2 w-56 bg-[#0F172A] text-white text-xs font-medium px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        Read the full AI Research section to enable approval.
                        <div className="absolute top-full right-4 border-4 border-transparent border-t-[#0F172A]"></div>
                      </div>
                    )}
                  </div>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Deadline Popup Modal */}
      {isDeadlinePopupOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-100 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h2 className="text-lg font-black text-[#0F172A] tracking-tight">
                {deadlineStep === 1 ? "Select Case" : "Case Deadline Calendar"}
              </h2>
              <button
                onClick={() => setIsDeadlinePopupOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <X size={20} weight="bold" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {deadlineStep === 1 && (
                <div className="flex flex-col gap-4">
                  <p className="text-sm font-medium text-slate-600">
                    Select a case to view its deadline timeline.
                  </p>
                  <select
                    value={selectedDeadlineCase}
                    onChange={(e) => setSelectedDeadlineCase(e.target.value)}
                    className="w-full bg-white border border-slate-200 px-3 py-2.5 text-sm font-bold text-[#0F172A] focus:outline-none focus:border-slate-400 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <option value="" disabled>Select a Case ID</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.case_id}>
                        {c.case_id}
                      </option>
                    ))}
                  </select>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => setDeadlineStep(2)}
                      disabled={!selectedDeadlineCase}
                      className="px-6 py-2.5 bg-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next <ArrowRight size={16} weight="bold" />
                    </button>
                  </div>
                </div>
              )}

              {deadlineStep === 2 && (() => {
                const uploadedDate = new Date(new Date().getFullYear(), 4, 7); // May 7, current year
                const deadlineDate = new Date(uploadedDate);
                deadlineDate.setDate(deadlineDate.getDate() + 45); // 1.5 months ahead
                
                const yellowStart = new Date(uploadedDate);
                yellowStart.setDate(yellowStart.getDate() - 7);
                const yellowEnd = new Date(uploadedDate);
                yellowEnd.setDate(yellowEnd.getDate() - 1);
                
                const greenEnd = new Date(uploadedDate.getFullYear(), uploadedDate.getMonth() + 1, 0); // End of May
                
                const redStart = new Date(deadlineDate);
                redStart.setDate(redStart.getDate() - 7);

                const getDayColor = (currentCellDate) => {
                  const normTime = new Date(currentCellDate.getFullYear(), currentCellDate.getMonth(), currentCellDate.getDate()).getTime();
                  const normUp = new Date(uploadedDate.getFullYear(), uploadedDate.getMonth(), uploadedDate.getDate()).getTime();
                  const normDead = new Date(deadlineDate.getFullYear(), deadlineDate.getMonth(), deadlineDate.getDate()).getTime();
                  const normYellowS = new Date(yellowStart.getFullYear(), yellowStart.getMonth(), yellowStart.getDate()).getTime();
                  const normYellowE = new Date(yellowEnd.getFullYear(), yellowEnd.getMonth(), yellowEnd.getDate()).getTime();
                  const normGreenE = new Date(greenEnd.getFullYear(), greenEnd.getMonth(), greenEnd.getDate()).getTime();
                  const normRedS = new Date(redStart.getFullYear(), redStart.getMonth(), redStart.getDate()).getTime();

                  if (normTime >= normYellowS && normTime <= normYellowE) {
                    return "bg-[#fef08a] text-[#854d0e]"; // Yellow
                  }
                  if (normTime >= normUp && normTime <= normGreenE) {
                    return "bg-[#bbf7d0] text-[#166534]"; // Green
                  }
                  if (normTime >= normRedS && normTime <= normDead) {
                    return "bg-[#fecaca] text-[#991b1b]"; // Red
                  }
                  return "text-[#0F172A] hover:bg-slate-50";
                };

                const firstDay = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), 1).getDay();
                const daysInMonth = new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 0).getDate();

                return (
                  <div className="flex flex-col gap-4 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 mb-2">
                      <button 
                        onClick={() => setDeadlineStep(1)} 
                        className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                      >
                        <CaretLeft size={16} weight="bold" />
                      </button>
                      <span className="text-sm font-bold text-slate-500">Back to Selection</span>
                    </div>

                    <div className="flex items-center justify-between px-2 mb-2">
                      <button onClick={handlePrevMonth} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                        <CaretLeft size={16} weight="bold" />
                      </button>
                      <span className="font-bold text-base text-[#0F172A]">
                        {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
                      </span>
                      <button onClick={handleNextMonth} className="text-slate-400 hover:text-slate-600 transition-colors p-2">
                        <CaretRight size={16} weight="bold" />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 mb-2">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-center text-[11px] font-bold text-slate-500">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-y-2 gap-x-2">
                      {Array.from({ length: firstDay }).map((_, i) => (
                        <div key={`empty-${i}`}></div>
                      ))}
                      {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
                        const currentCellDate = new Date(calendarDate.getFullYear(), calendarDate.getMonth(), day);
                        const colorClass = getDayColor(currentCellDate);
                        
                        return (
                          <div key={day} className="flex flex-col items-center justify-center">
                            <div className={`w-8 h-8 flex items-center justify-center font-bold text-[13px] rounded-sm transition-colors cursor-pointer ${colorClass}`}>
                              {day}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 bg-[#fef08a] rounded-sm"></div>
                        <span className="text-xs font-medium text-slate-600">1 Week Before Upload (Yellow)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 bg-[#bbf7d0] rounded-sm"></div>
                        <span className="text-xs font-medium text-slate-600">Upload Date to Month End (Green)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-3.5 h-3.5 bg-[#fecaca] rounded-sm"></div>
                        <span className="text-xs font-medium text-slate-600">1 Week Before Deadline (Red)</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}