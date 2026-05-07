import { useState, lazy, Suspense, useEffect } from "react";
import { API_CASES } from "../../lib/apiConfig.js";
import * as XLSX from "xlsx";
import {
  Building2,
  FileDown,
  SlidersHorizontal,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  X,
  ChevronRight,
} from "lucide-react";
const DepartmentsDetailChart = lazy(() => import("@/components/charts/DepartmentsDetailChart"));


// ── Mock Data ──────────────────────────────────────────────────────────────────

const departmentRows = [
  {
    id: "revenue",
    name: "Revenue Department",
    total: 142,
    pending: 28,
    overdue: 12,
    compliance: 84,
    risk: "medium",
    trend: "+12.4%",
    trendUp: true,
    trendData: [
      { v: 60 }, { v: 65 }, { v: 58 }, { v: 72 }, { v: 68 }, { v: 80 }, { v: 84 },
    ],
    caseDistribution: [
      { label: "Property Disputes", count: 64, max: 142 },
      { label: "Tax Compliance",    count: 42, max: 142 },
      { label: "Other Legal",       count: 36, max: 142 },
    ],
    recentActions: [
      {
        text: "Case #VS-2024-0891 status updated to",
        link: "Pending Review",
        linkColor: "text-orange-600",
        time: "2 hours ago",
        faded: false,
      },
      {
        text: "New compliance report uploaded by R. Kumar (Dept Head)",
        link: null,
        time: "Yesterday, 4:15 PM",
        faded: false,
      },
      {
        text: "Audit flag cleared for Quarterly Asset Review",
        link: null,
        time: "",
        faded: true,
      },
    ],
  },
  {
    id: "law",
    name: "Law Department",
    total: 89,
    pending: 12,
    overdue: 2,
    compliance: 96,
    risk: "low",
    trend: "-3.1%",
    trendUp: false,
    trendData: [
      { v: 90 }, { v: 92 }, { v: 94 }, { v: 91 }, { v: 95 }, { v: 96 }, { v: 96 },
    ],
    caseDistribution: [
      { label: "Civil Litigation",  count: 38, max: 89 },
      { label: "Criminal Review",   count: 31, max: 89 },
      { label: "Other Legal",       count: 20, max: 89 },
    ],
    recentActions: [
      {
        text: "Case #VS-2024-0712 approved by Senior Counsel",
        link: null,
        time: "3 hours ago",
        faded: false,
      },
      {
        text: "Compliance checklist submitted for Q2 review",
        link: null,
        time: "Yesterday, 2:00 PM",
        faded: false,
      },
    ],
  },
  {
    id: "public-works",
    name: "Public Works Department",
    total: 215,
    pending: 45,
    overdue: 4,
    compliance: 92,
    risk: "low",
    trend: "+2.1%",
    trendUp: true,
    trendData: [
      { v: 85 }, { v: 87 }, { v: 88 }, { v: 90 }, { v: 91 }, { v: 92 }, { v: 92 },
    ],
    caseDistribution: [
      { label: "Infrastructure",    count: 98, max: 215 },
      { label: "Contract Disputes", count: 72, max: 215 },
      { label: "Other Legal",       count: 45, max: 215 },
    ],
    recentActions: [
      {
        text: "Case #VS-2024-1023 escalated to",
        link: "Chief Engineer",
        linkColor: "text-blue-600",
        time: "1 hour ago",
        faded: false,
      },
      {
        text: "Quarterly audit report submitted",
        link: null,
        time: "2 days ago",
        faded: false,
      },
    ],
  },
  {
    id: "finance",
    name: "Finance Department",
    total: 67,
    pending: 8,
    overdue: 0,
    compliance: 100,
    risk: "low",
    trend: "+0.8%",
    trendUp: true,
    trendData: [
      { v: 95 }, { v: 96 }, { v: 97 }, { v: 98 }, { v: 99 }, { v: 100 }, { v: 100 },
    ],
    caseDistribution: [
      { label: "Budget Compliance", count: 32, max: 67 },
      { label: "Audit Findings",    count: 21, max: 67 },
      { label: "Other Legal",       count: 14, max: 67 },
    ],
    recentActions: [
      {
        text: "All cases marked compliant for FY 2024-25",
        link: null,
        time: "Today, 9:00 AM",
        faded: false,
      },
      {
        text: "Annual compliance certificate issued",
        link: null,
        time: "3 days ago",
        faded: false,
      },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const riskDot = {
  high:   "bg-red-500",
  medium: "bg-amber-500",
  low:    "bg-green-500",
};

const riskLabel = {
  high:   "text-red-600",
  medium: "text-amber-600",
  low:    "text-green-600",
};

function ProgressBar({ value, max, color = "bg-[#0F172A]" }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 overflow-hidden">
        <div
          className={`h-full ${color} transition-all`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-bold text-slate-500 w-6 text-right">{value}</span>
    </div>
  );
}

function ComplianceBar({ value }) {
  const color =
    value === 100 ? "bg-green-500" :
    value >= 90   ? "bg-[#0F172A]" :
    value >= 80   ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-2 min-w-[90px]">
      <div className="flex-1 h-1.5 bg-slate-100 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-[12px] font-bold text-[#0F172A]">{value}%</span>
    </div>
  );
}

// ── Detail Panel ───────────────────────────────────────────────────────────────

function DetailPanel({ dept, onClose }) {
  const lineColor = dept.trendUp ? "#EF4444" : "#22C55E";

  return (
    <div className="bg-white border border-slate-200 shadow-sm flex flex-col h-full">
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Department Details
        </span>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Title + Trend */}
        {/* <div className="px-5 pt-5 pb-4 border-b border-slate-100"> */}
          {/* <h3 className="text-[15px] font-bold text-[#0F172A] mb-3">{dept.name}</h3> */}
          {/* <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {dept.trendUp ? (
                <TrendingUp size={14} className="text-red-500" />
              ) : (
                <TrendingDown size={14} className="text-green-500" />
              )}
              <span
                className={`text-[12px] font-bold ${
                  dept.trendUp ? "text-red-600" : "text-green-600"
                }`}
              >
                {dept.trend} vs last mo
              </span>
            </div>
            {/* Sparkline */}
            {/* <div className="w-28 h-10">
              <Suspense fallback={<div className="w-full h-full bg-slate-50 animate-pulse" />}>
                <DepartmentsDetailChart data={dept.trendData} lineColor={lineColor} />
              </Suspense>
            </div> */}
          {/* </div> */}
        {/* </div> */}

        {/* Case Distribution */}
        <div className="px-5 py-4 border-b border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Case Distribution
          </p>
          <div className="space-y-3">
            {dept.caseDistribution.map((item) => (
              <div key={item.label}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[12px] font-medium text-slate-600">{item.label}</span>
                </div>
                <ProgressBar value={item.count} max={item.max} />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Actions */}
        <div className="px-5 py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
            Recent Actions
          </p>
          <div className="space-y-3">
            {dept.recentActions.map((action, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div
                  className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    action.faded ? "bg-slate-300" : "bg-slate-400"
                  }`}
                />
                <div>
                  <p
                    className={`text-[12px] leading-snug ${
                      action.faded ? "text-slate-400" : "text-slate-700"
                    }`}
                  >
                    {action.text}{" "}
                    {action.link && (
                      <span
                        className={`font-bold cursor-pointer hover:underline ${action.linkColor}`}
                      >
                        "{action.link}"
                      </span>
                    )}
                  </p>
                  {action.time && (
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {action.time}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel Footer */}
      {/* <div className="px-5 py-4 border-t border-slate-100">
        <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-[12px] font-bold tracking-wide hover:bg-slate-800 transition-colors">
          View Full Report <ChevronRight size={13} />
        </button>
      </div> */}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function DepartmentsPage() {
  const [activeTab, setActiveTab] = useState("all");
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(API_CASES);
        const data = await response.json();
        
        if (data.cases) {
          const deptMap = {};
          const now = new Date();
          
          data.cases.forEach(c => {
            const dName = c.department || "General";
            if (!deptMap[dName]) {
              deptMap[dName] = {
                id: dName.toLowerCase().replace(/\s+/g, '-'),
                name: dName,
                total: 0,
                pending: 0,
                overdue: 0,
                compliance: 100,
                risk: "low",
                trend: "+0%",
                trendUp: true,
                trendData: [{v:80}, {v:85}, {v:90}, {v:95}],
                caseDistributionMap: {},
                caseDistribution: [],
                recentActions: []
              };
            }
            const d = deptMap[dName];
            d.total += 1;
            
            const isPending = c.status === "PENDING REVIEW" || c.status?.toLowerCase().includes("pending");
            if (isPending) d.pending += 1;
            
            if (c.deadline && new Date(c.deadline) < now) {
              d.overdue += 1;
            }
            
            const type = c.priority || "Medium Priority";
            d.caseDistributionMap[type] = (d.caseDistributionMap[type] || 0) + 1;
            
            if (d.recentActions.length < 3) {
              d.recentActions.push({
                text: `Case ${c.case_id} is ${c.status}`,
                link: null,
                time: c.created_at ? new Date(c.created_at).toLocaleDateString() : "Recently",
                faded: false
              });
            }
          });
          
          const deptList = Object.values(deptMap).map(d => {
            const comp = d.total > 0 ? Math.round(((d.total - d.overdue) / d.total) * 100) : 100;
            d.compliance = comp;
            if (comp < 85) d.risk = "high";
            else if (comp < 95) d.risk = "medium";
            else d.risk = "low";
            
            d.caseDistribution = Object.entries(d.caseDistributionMap).map(([label, count]) => ({
              label, count, max: d.total
            }));
            
            return d;
          });
          
          setDepartments(deptList);
          if (deptList.length > 0) {
            setSelectedDept(deptList[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchData();
  }, []);

  const displayed =
    activeTab === "active"
      ? departments.filter((d) => d.overdue > 0 || d.pending > 0)
      : departments;

  const totalDepartmentsCount = departments.length;
  const highRiskCount = departments.filter(d => d.risk === 'high').length;
  const totalOverdueCount = departments.reduce((acc, d) => acc + d.overdue, 0);

  const handleExport = () => {
    const exportData = departments.map(d => ({
      "Department Name": d.name,
      "Total Cases": d.total,
      "Pending Cases": d.pending,
      "Overdue Cases": d.overdue,
      "Compliance Rate": `${d.compliance}%`,
      "Risk Level": d.risk.toUpperCase()
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Departments");
    XLSX.writeFile(workbook, "Department_Report.xlsx");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Department Overview</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Monitor compliance and workload by department
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-[#0F172A] text-[13px] font-bold hover:bg-slate-50 transition-colors">
            <SlidersHorizontal size={14} />
            Filter
          </button> */}
          <button 
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#0F172A] text-[#0F172A] text-[13px] font-bold hover:bg-[#0F172A] hover:text-white transition-colors"
          >
            <FileDown size={14} />
            Export to Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Departments */}
        <div className="bg-white border border-slate-200 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-slate-100 flex items-center justify-center shrink-0 text-slate-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Total Departments
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{totalDepartmentsCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-green-100 text-green-700">
              <TrendingUp size={10} /> Up to date
            </span>
          </div>
        </div>

        {/* High Risk */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              High Risk Departments
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{highRiskCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700">
              <AlertTriangle size={10} /> Active alerts
            </span>
          </div>
        </div>

        {/* Overdue Cases */}
        <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-red-50 flex items-center justify-center shrink-0 text-red-500">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Overdue Cases
            </p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{totalOverdueCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-red-100 text-red-700">
              <TrendingUp size={10} /> Requires attention
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* LEFT: Department Metrics Table */}
        <div className="xl:w-[55%] bg-white border border-slate-200 shadow-sm overflow-hidden">
          {/* Toggle */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100">
            <div className="flex items-center gap-1 bg-[#F8FAFC] p-1">
              {["all", "active"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-[12px] font-bold tracking-wide transition-colors capitalize ${
                    activeTab === tab
                      ? "bg-[#0F172A] text-white"
                      : "text-slate-500 hover:text-[#0F172A]"
                  }`}
                >
                  {tab === "all" ? "All" : "Active"}
                </button>
              ))}
            </div>
            <span className="text-[11px] font-medium text-slate-400">
              {displayed.length} departments
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[580px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  {[
                    "Department Name",
                    "Total Cases",
                    "Pending",
                    "Overdue",
                    "Compliance Rate",
                    "Risk",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((d) => {
                  const isSelected = selectedDept?.id === d.id;
                  return (
                    <tr
                      key={d.id}
                      onClick={() => setSelectedDept(isSelected ? null : d)}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "border-l-[3px] border-l-[#0F172A] bg-slate-50"
                          : "border-l-[3px] border-l-transparent hover:bg-slate-50/60"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span
                          className={`text-[13px] font-bold ${
                            isSelected ? "text-[#0F172A]" : "text-slate-700"
                          }`}
                        >
                          {d.name}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-600">
                        {d.total}
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-600">
                        {d.pending}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[13px] font-bold ${
                            d.overdue > 0 ? "text-red-600" : "text-slate-500"
                          }`}
                        >
                          {d.overdue}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <ComplianceBar value={d.compliance} />
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-1.5">
                          <div
                            className={`w-2 h-2 rounded-full ${riskDot[d.risk]}`}
                          />
                          <span
                            className={`text-[11px] font-bold uppercase ${riskLabel[d.risk]}`}
                          >
                            {d.risk}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Detail Panel */}
        <div className="xl:w-[45%] w-full">
          {selectedDept ? (
            <DetailPanel
              dept={selectedDept}
              onClose={() => setSelectedDept(null)}
            />
          ) : (
            <div className="bg-white border border-slate-200 shadow-sm p-12 flex flex-col items-center justify-center text-center gap-3">
              <Building2 size={32} className="text-slate-300" />
              <p className="text-[13px] font-bold text-slate-400">
                Select a department to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
