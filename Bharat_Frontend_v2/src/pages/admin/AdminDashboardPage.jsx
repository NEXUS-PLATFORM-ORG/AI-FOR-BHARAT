import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { API_CASES, API_NOTIF } from "../../lib/apiConfig.js";
import {
  TrendingUp,
  AlertTriangle,
  Clock,
  Activity,
  Bot,
  X,
  BarChart2,
  FileDown,
} from "lucide-react";

// ── Helpers ────────────────────────────────────────────────────────────────────

const timeAgo = (dateStr) => {
  if (!dateStr) return "Just now";
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  if (seconds < 60) return `${Math.max(0, seconds)} secs ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return `${days} days ago`;
};

const riskBadge = {
  HIGH:   "bg-red-100 text-red-700",
  MEDIUM: "bg-amber-100 text-amber-700",
  LOW:    "bg-green-100 text-green-700",
};

const deadlineBadgeColor = {
  red:   "bg-red-100 text-red-700",
  amber: "bg-amber-100 text-amber-700",
  green: "bg-green-100 text-green-700",
};

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({ title, value, badge, badgeClass, borderClass, icon: Icon, iconClass, sub }) {
  return (
    <div className={`bg-white border border-slate-200 ${borderClass ?? ""} p-5 flex items-start gap-4 shadow-sm`}>
      <div className={`h-11 w-11 flex items-center justify-center shrink-0 ${iconClass}`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">{title}</p>
        <p className="text-3xl font-bold text-[#0F172A] leading-none">{value}</p>
        {badge && (
          <span className={`inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider ${badgeClass}`}>
            {badge}
          </span>
        )}
        {sub && <p className="text-[11px] text-slate-400 mt-1.5 font-medium">{sub}</p>}
      </div>
    </div>
  );
}

function DeadlineItem({ id, dept, label, color }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
      <div>
        <p className="text-[13px] font-bold text-[#0F172A]">{id}</p>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{dept}</p>
      </div>
      <span className={`px-2 py-0.5 text-[10px] font-bold tracking-wider ${deadlineBadgeColor[color]}`}>
        {label}
      </span>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const [showAdvisory, setShowAdvisory] = useState(true);
  const [cases, setCases] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [next7DaysCases, setNext7DaysCases] = useState([]);
  const [next14DaysCases, setNext14DaysCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCases() {
      try {
        const response = await fetch(API_CASES);
        const data = await response.json();
        if (data.cases) {
          setCases(data.cases);
          setNext7DaysCases(data.next7Days || []);
          setNext14DaysCases(data.next14Days || []);
        }
      } catch (error) {
        console.error("Error fetching cases:", error);
      } finally {
        setIsLoading(false);
      }
    }

    async function fetchNotifications() {
      try {
        const token = localStorage.getItem("token");
        if (!token || token === "null" || token === "undefined") {
          console.warn("No valid token, skipping notifications fetch");
          return;
        }
        
        const response = await fetch(API_NOTIF, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            console.error("Token is missing or expired. Please log in again to view notifications.");
          } else {
            console.error("Failed to fetch notifications:", response.status);
          }
          return;
        }

        const data = await response.json();
        if (data.notifications) {
          setAuditLogs(data.notifications);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    }

    fetchCases();
    fetchNotifications();
  }, []);

  const now = new Date();
  
  // KPI Computations
  const totalCases = cases.length;
  const pendingActions = cases.filter(c => c.status === "PENDING REVIEW" || c.status?.toLowerCase().includes("pending")).length;
  const overdueCases = cases.filter(c => c.deadline && new Date(c.deadline) < now).length;
  
  const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const next14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const upcoming7 = cases
    .filter(c => {
      if (!c.created_at) return false;
      const deadline7 = new Date(new Date(c.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      return deadline7 > now && deadline7 <= next7Days;
    })
    .map(c => {
      const deadline7 = new Date(new Date(c.created_at).getTime() + 7 * 24 * 60 * 60 * 1000);
      const days = Math.ceil((deadline7 - now) / (1000 * 60 * 60 * 24));
      return {
        id: c.case_id || "Unknown",
        dept: c.department || "General",
        label: days <= 1 ? "24H LEFT" : `${days} DAYS`,
        color: days <= 1 ? "red" : "amber"
      };
    });
    
  const upcoming14 = cases
    .filter(c => {
      if (!c.created_at) return false;
      const deadline14 = new Date(new Date(c.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
      return deadline14 > next7Days && deadline14 <= next14Days;
    })
    .map(c => {
      const deadline14 = new Date(new Date(c.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
      const days = Math.ceil((deadline14 - now) / (1000 * 60 * 60 * 24));
      return {
        id: c.case_id || "Unknown",
        dept: c.department || "General",
        label: `${days} DAYS`,
        color: "green"
      };
    });

  const upcomingDeadlinesCount = upcoming7.length;

  // Department Computations
  const deptMap = {};
  cases.forEach(c => {
    const dept = c.department || "General";
    if (!deptMap[dept]) {
      deptMap[dept] = { name: dept, total: 0, pending: 0, overdue: 0, risk: "LOW" };
    }
    deptMap[dept].total += 1;
    if (c.status === "PENDING REVIEW" || c.status?.toLowerCase().includes("pending")) {
      deptMap[dept].pending += 1;
    }
    if (c.deadline && new Date(c.deadline) < now) {
      deptMap[dept].overdue += 1;
    }
  });

  const computedDepartments = Object.values(deptMap).map(d => {
    if (d.overdue > 2) d.risk = "HIGH";
    else if (d.overdue > 0 || d.pending > 5) d.risk = "MEDIUM";
    else d.risk = "LOW";
    return d;
  });
  
  computedDepartments.sort((a, b) => b.total - a.total);

  const displayDepartments = computedDepartments;
  const display7 = upcoming7;
  const display14 = upcoming14;

  const handleExport = () => {
    const exportData = computedDepartments.map(d => ({
      "Department Name": d.name,
      "Total Cases": d.total,
      "Pending Actions": d.pending,
      "Overdue Cases": d.overdue,
      "Risk Level": d.risk
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
          <h1 className="text-xl font-bold text-[#0F172A]">Administrative Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            State-level compliance and monitoring oversight
          </p>
        </div>
        <button 
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#0F172A] text-[#0F172A] text-[13px] font-bold hover:bg-[#0F172A] hover:text-white transition-colors self-start sm:self-auto"
        >
          <FileDown size={15} />
          Export to Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          title="Total Cases"
          value={totalCases.toLocaleString()}
          icon={BarChart2}
          iconClass="bg-slate-100 text-slate-600"
          badge={null}
          badgeClass=""
        />
        <KpiCard
          title="Pending Actions"
          value={pendingActions.toLocaleString()}
          icon={Activity}
          iconClass="bg-orange-50 text-orange-500"
          badge={<><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block" /> Active</>}
          badgeClass="bg-orange-100 text-orange-600"
        />
        <KpiCard
          title="Overdue Cases"
          value={overdueCases.toLocaleString()}
          icon={AlertTriangle}
          iconClass="bg-red-50 text-red-500"
          borderClass={overdueCases > 0 ? "border-l-4 border-l-red-500" : ""}
          badge={overdueCases > 0 ? <><AlertTriangle size={11} /> Critical</> : null}
          badgeClass={overdueCases > 0 ? "bg-red-100 text-red-700" : ""}
        />
        <KpiCard
          title="Upcoming Deadlines"
          value={upcomingDeadlinesCount.toLocaleString()}
          icon={Clock}
          iconClass="bg-blue-50 text-blue-500"
          badge={<><Clock size={11} /> 7 Days</>}
          badgeClass="bg-blue-100 text-blue-700"
        />
      </div>

      {/* Main Content: Table + Right Panel */}
      <div className="flex flex-col xl:flex-row gap-5">

        {/* Department Performance Table */}
        <div className="xl:w-[65%] bg-white border border-slate-200 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
              Department Performance
            </h2>
            <button className="text-[12px] font-bold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[560px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-slate-100">
                  {["Department Name", "Total Cases", "Pending", "Overdue", "Risk Level"].map((h) => (
                    <th key={h} className="px-5 py-3.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayDepartments.map((d) => (
                  <tr key={d.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-4 text-[13px] font-bold text-[#0F172A]">{d.name}</td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600">{d.total}</td>
                    <td className="px-5 py-4 text-[13px] font-medium text-slate-600">{d.pending}</td>
                    <td className="px-5 py-4">
                      <span className={`text-[13px] font-bold ${d.overdue > 0 ? "text-red-600" : "text-slate-600"}`}>
                        {d.overdue}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold tracking-wider ${riskBadge[d.risk] || "bg-slate-100 text-slate-700"}`}>
                        {d.risk}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Panel */}
        <div className="xl:w-[35%] flex flex-col gap-5">

          {/* Deadline Tracker */}
          <div className="bg-white border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider flex items-center gap-2">
                <Clock size={14} /> Deadline Tracker
              </h2>
            </div>
            <div className="overflow-y-auto flex-1">
              <div className="px-5 pt-4 pb-2">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Next 7 Days
                </p>
                {display7.length > 0 ? display7.map((d) => <DeadlineItem key={d.id} {...d} />) : <p className="text-xs text-slate-500 py-2">No upcoming deadlines.</p>}
              </div>
              <div className="px-5 pt-3 pb-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Next 14 Days
                </p>
                {display14.length > 0 ? display14.map((d) => <DeadlineItem key={d.id} {...d} />) : <p className="text-xs text-slate-500 py-2">No upcoming deadlines.</p>}
              </div>
            </div>
          </div>

          {/* Recent Audit Actions */}
          <div className="bg-white border border-slate-200 shadow-sm flex flex-col h-[400px]">
            <div className="px-5 py-4 border-b border-slate-100 shrink-0">
              <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                Recent Audit Actions
              </h2>
            </div>
            <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="px-5 py-3.5 flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-400 mt-2 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[12px] font-bold text-[#0F172A]">
                      {log.title}:{" "}
                      <span className="font-semibold text-slate-700">{log.message}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                      {timeAgo(log.created_at)} · {log.type || "System"}
                    </p>
                  </div>
                </div>
              ))}
              {auditLogs.length === 0 && (
                <p className="text-xs text-slate-500 py-4 px-5">No recent actions.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* AI Compliance Advisory Banner */}
      {showAdvisory && (
        <div className="bg-[#0F172A] text-white p-6 md:p-8 relative">
          <button
            onClick={() => setShowAdvisory(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>

          <div className="flex items-start gap-4 mb-4">
            <div className="w-10 h-10 bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold tracking-wide">AI Compliance Advisory</h3>
              <p className="text-slate-400 text-[12px] font-medium mt-0.5">
                Automated system analysis · Updated 5 mins ago
              </p>
            </div>
          </div>

          <p className="text-[13px] text-slate-300 leading-relaxed max-w-4xl mb-6">
            System analysis indicates a high-density bottleneck within the Land Revenue
            department's approval chain. 84% of overdue cases are currently stalled at the
            Verification Tier 2 stage, suggesting structural staffing deficits or procedural
            friction. Recommendation: Automate preliminary document cross-referencing for all
            Category B cases to reduce manual load by an estimated 22% over the next fiscal
            quarter.
          </p>

          <div className="flex flex-wrap gap-3">
            <button className="px-5 py-2.5 bg-blue-600 text-white text-[12px] font-bold tracking-wider hover:bg-blue-700 transition-colors flex items-center gap-2">
              <BarChart2 size={14} /> GENERATE DETAILED ANALYTICS
            </button>
            <button
              onClick={() => setShowAdvisory(false)}
              className="px-5 py-2.5 border border-slate-500 text-slate-300 text-[12px] font-bold tracking-wider hover:border-slate-300 hover:text-white transition-colors"
            >
              DISMISS INSIGHT
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
