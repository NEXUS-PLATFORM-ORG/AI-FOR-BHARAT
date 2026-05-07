import { useState, useEffect, lazy, Suspense } from "react";
import { API_CASES } from "../../lib/apiConfig.js";
import * as XLSX from "xlsx";
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Bot,
  BarChart2,
  FileDown,
  AlertTriangle,
  Info,
  CheckCircle,
} from "lucide-react";
const RiskDistributionChart = lazy(() => import("@/components/charts/RiskDistributionChart"));

// ── Helpers ────────────────────────────────────────────────────────────────────

function classifyRisk(c, now) {
  const deadline14 = c.created_at
    ? new Date(new Date(c.created_at).getTime() + 14 * 24 * 60 * 60 * 1000)
    : null;
  const isOverdue = deadline14 && deadline14 < now;
  const isPending =
    c.status === "PENDING REVIEW" || c.status?.toLowerCase().includes("pending");

  if (isOverdue) return "HIGH";
  if (isPending) return "MEDIUM";
  return "LOW";
}

function timeLeft(c, now) {
  if (!c.created_at) return { label: "N/A", urgent: false };
  const deadline = new Date(new Date(c.created_at).getTime() + 14 * 24 * 60 * 60 * 1000);
  const diff = deadline - now;
  if (diff <= 0) {
    const overMs = Math.abs(diff);
    const days = Math.floor(overMs / (1000 * 60 * 60 * 24));
    const hrs = Math.floor((overMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    return { label: days > 0 ? `${days}d ${hrs}h overdue` : `${hrs}h overdue`, urgent: true };
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hrs = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return { label: days > 0 ? `${days}d ${hrs}h` : `${hrs}h`, urgent: days < 2 };
}

function reasonFor(c, risk) {
  if (risk === "HIGH") {
    if (c.status?.toLowerCase().includes("pending")) return "Overdue & pending review";
    return "Exceeded 14-day deadline";
  }
  if (risk === "MEDIUM") return "Pending review";
  return "Compliant";
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export function RiskAnalysisPage() {
  const [chartTab, setChartTab] = useState("weekly");
  const [cases, setCases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

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

  // ── Risk classification ────────────────────────────────────────────────────
  const classified = cases.map(c => ({ ...c, _risk: classifyRisk(c, now) }));

  const highRiskCount = classified.filter(c => c._risk === "HIGH").length;
  const mediumRiskCount = classified.filter(c => c._risk === "MEDIUM").length;
  const lowRiskCount = classified.filter(c => c._risk === "LOW").length;

  // ── Chart data: group by department ────────────────────────────────────────
  const deptRisk = {};
  classified.forEach(c => {
    const dept = c.department || "General";
    if (!deptRisk[dept]) deptRisk[dept] = { dept, high: 0, medium: 0, low: 0, total: 0 };
    deptRisk[dept].total += 1;
    if (c._risk === "HIGH") deptRisk[dept].high += 1;
    else if (c._risk === "MEDIUM") deptRisk[dept].medium += 1;
    else deptRisk[dept].low += 1;
  });

  const deptList = Object.values(deptRisk).sort((a, b) => b.total - a.total);

  const chartData = deptList.map(d => ({
    dept: d.dept.length > 12 ? d.dept.slice(0, 10) + "…" : d.dept,
    actual: d.high + d.medium,
    threshold: d.total,
  }));

  // ── High-risk cases table ──────────────────────────────────────────────────
  const riskyRows = classified
    .filter(c => c._risk === "HIGH" || c._risk === "MEDIUM")
    .sort((a, b) => {
      if (a._risk === "HIGH" && b._risk !== "HIGH") return -1;
      if (a._risk !== "HIGH" && b._risk === "HIGH") return 1;
      return 0;
    })
    .slice(0, 10)
    .map(c => {
      const tl = timeLeft(c, now);
      return {
        id: c.case_id || "Unknown",
        dept: c.department || "General",
        risk: c._risk,
        deadline: tl.label,
        deadlineRed: tl.urgent,
        reason: reasonFor(c, c._risk),
        status: c.status || "—",
      };
    });

  // ── AI Insights (generated from real data) ────────────────────────────────
  const topHighDept = deptList.find(d => d.high > 0);
  const topPendingDept = deptList.reduce((max, d) => d.medium > (max?.medium ?? 0) ? d : max, null);

  const aiAlerts = [];
  if (topHighDept && topHighDept.high > 0) {
    aiAlerts.push({
      type: "SYSTEM ALERT",
      typeClass: "bg-red-100 text-red-700",
      badge: "CRITICAL",
      badgeClass: "bg-red-500 text-white",
      icon: AlertTriangle,
      iconClass: "text-red-500",
      title: `${topHighDept.dept} has ${topHighDept.high} high-risk case${topHighDept.high > 1 ? "s" : ""}`,
      body: `${topHighDept.high} case(s) in ${topHighDept.dept} have exceeded the 14-day processing deadline and require immediate attention.`,
      borderClass: "border-l-red-500",
    });
  }
  if (topPendingDept && topPendingDept.medium > 0) {
    aiAlerts.push({
      type: "BOTTLENECK DETECTED",
      typeClass: "bg-amber-100 text-amber-700",
      badge: "OPERATIONAL",
      badgeClass: "bg-amber-500 text-white",
      icon: Info,
      iconClass: "text-amber-500",
      title: `Pending review backlog in ${topPendingDept.dept}`,
      body: `${topPendingDept.medium} case(s) are awaiting review in ${topPendingDept.dept}. Consider prioritizing to prevent deadline breaches.`,
      borderClass: "border-l-amber-500",
    });
  }
  if (lowRiskCount > 0) {
    aiAlerts.push({
      type: "COMPLIANCE STATUS",
      typeClass: "bg-green-100 text-green-700",
      badge: "HEALTHY",
      badgeClass: "bg-green-500 text-white",
      icon: CheckCircle,
      iconClass: "text-green-500",
      title: `${lowRiskCount} cases are within compliance thresholds`,
      body: `${lowRiskCount} out of ${cases.length} total cases are processing within normal timelines. No immediate action required.`,
      borderClass: "border-l-green-500",
    });
  }

  // ── Escalation probability ────────────────────────────────────────────────
  const totalCases = cases.length || 1;
  const overduePct = Math.round((highRiskCount / totalCases) * 100);
  const pendingPct = Math.round((mediumRiskCount / totalCases) * 100);

  const escalationBars = [
    { label: "Overdue Escalation", pct: overduePct, barClass: "bg-red-500", textClass: "text-red-500" },
    { label: "Pending Backlog", pct: pendingPct, barClass: "bg-amber-400", textClass: "text-amber-500" },
  ];

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const exportData = classified.map(c => ({
      "Case ID": c.case_id || "Unknown",
      "Department": c.department || "General",
      "Status": c.status || "—",
      "Risk Level": c._risk,
      "Upload Date": c.created_at ? new Date(c.created_at).toLocaleDateString() : "—",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Risk Analysis");
    XLSX.writeFile(workbook, "Risk_Analysis_Report.xlsx");
  };

  return (
    <div className="p-4 md:p-8 max-w-[1600px] mx-auto space-y-6">

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0F172A]">Risk Analytics</h1>
          <p className="text-sm text-slate-500 mt-0.5 font-medium">
            Identify compliance risks and bottlenecks across all active legislative tracks.
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center gap-2 px-4 py-2.5 border border-[#0F172A] text-[#0F172A] text-[13px] font-bold hover:bg-[#0F172A] hover:text-white transition-colors self-start sm:self-auto"
        >
          <FileDown size={14} />
          Export to Excel
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 border-l-4 border-l-red-500 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-red-50 flex items-center justify-center shrink-0 text-red-500">
            <ShieldAlert size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">High Risk Cases</p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{highRiskCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-red-100 text-red-700">
              <TrendingUp size={10} /> Requires attention
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-amber-400 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-amber-50 flex items-center justify-center shrink-0 text-amber-500">
            <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Medium Risk</p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{mediumRiskCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-amber-100 text-amber-700">
              <BarChart2 size={10} /> Under review
            </span>
          </div>
        </div>

        <div className="bg-white border border-slate-200 border-l-4 border-l-green-500 shadow-sm p-5 flex items-start gap-4">
          <div className="h-11 w-11 bg-green-50 flex items-center justify-center shrink-0 text-green-500">
            <CheckCircle size={20} />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Low Risk</p>
            <p className="text-3xl font-bold text-[#0F172A] leading-none">{lowRiskCount}</p>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 text-[10px] font-bold tracking-wider bg-green-100 text-green-700">
              <TrendingDown size={10} /> Compliant
            </span>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col xl:flex-row gap-5 items-start">

        {/* LEFT (60%) */}
        <div className="xl:w-[60%] flex flex-col gap-5">

          {/* Bar Chart Card */}
          <div className="bg-white border border-slate-200 shadow-sm">
            <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div>
                <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                  System-wide Risk Distribution
                </h2>
                <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                  Departmental breakdown of compliance and processing risks
                </p>
              </div>
            </div>
            <div className="px-4 py-5">
              {chartData.length > 0 ? (
                <Suspense fallback={<div className="w-full h-[240px] bg-slate-50 animate-pulse" />}>
                  <RiskDistributionChart chartData={chartData} />
                </Suspense>
              ) : (
                <div className="w-full h-[240px] flex items-center justify-center text-sm text-slate-400">
                  {isLoading ? "Loading chart data…" : "No data available"}
                </div>
              )}
            </div>
          </div>

          {/* High Risk Cases Table */}
          <div className="bg-white border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                High Risk Cases
              </h2>
              <span className="text-[11px] font-medium text-slate-400">
                {riskyRows.length} flagged
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse whitespace-nowrap min-w-[560px]">
                <thead>
                  <tr className="bg-[#F8FAFC] border-b border-slate-100">
                    {["Case ID", "Department", "Risk Level", "Time Left", "Status", "Reason"].map((h) => (
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
                  {riskyRows.length > 0 ? riskyRows.map((c) => (
                    <tr
                      key={c.id}
                      className={`transition-colors hover:bg-slate-50/60 ${
                        c.risk === "HIGH"
                          ? "border-l-[3px] border-l-red-400"
                          : "border-l-[3px] border-l-amber-400"
                      }`}
                    >
                      <td className="px-5 py-4">
                        <span className="text-[13px] font-bold text-[#0F172A]">{c.id}</span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-600">{c.dept}</td>
                      <td className="px-5 py-4">
                        <span
                          className={`px-2.5 py-1 text-[10px] font-bold tracking-wider ${
                            c.risk === "HIGH"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {c.risk}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-[13px] font-bold ${
                            c.deadlineRed ? "text-red-600" : "text-slate-600"
                          }`}
                        >
                          {c.deadline}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-500">{c.status}</td>
                      <td className="px-5 py-4 text-[13px] font-medium text-slate-500">{c.reason}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-sm text-slate-400">
                        {isLoading ? "Loading cases…" : "No high-risk cases found."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT (40%): AI Risk Insights */}
        <div className="xl:w-[40%] bg-white border border-slate-200 shadow-sm flex flex-col">
          {/* Panel Header */}
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-[13px] font-bold text-[#0F172A] uppercase tracking-wider">
                AI Risk Insights
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Predictive analysis and proactive alerts
              </p>
            </div>
          </div>

          {/* Alerts */}
          <div className="divide-y divide-slate-100 flex-1">
            {aiAlerts.length > 0 ? aiAlerts.map((alert, i) => {
              const Icon = alert.icon;
              return (
                <div
                  key={i}
                  className={`px-5 py-4 border-l-4 ${alert.borderClass}`}
                >
                  {/* Type + Badge row */}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} className={alert.iconClass} />
                    <span className={`text-[10px] font-bold tracking-wider ${alert.typeClass} px-1.5 py-0.5`}>
                      {alert.type}
                    </span>
                    <span className={`text-[9px] font-bold tracking-wider px-1.5 py-0.5 ${alert.badgeClass}`}>
                      {alert.badge}
                    </span>
                  </div>
                  <p className="text-[13px] font-bold text-[#0F172A] leading-snug mb-1.5">
                    {alert.title}
                  </p>
                  <p className="text-[12px] text-slate-500 leading-relaxed">
                    {alert.body}
                  </p>
                </div>
              );
            }) : (
              <div className="px-5 py-8 text-center text-sm text-slate-400">
                {isLoading ? "Analyzing cases…" : "No risk insights available."}
              </div>
            )}
          </div>

          {/* Probability of Escalation */}
          <div className="px-5 py-4 border-t border-slate-100">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
              Probability of Escalation
            </p>
            <div className="space-y-3">
              {escalationBars.map((b) => (
                <div key={b.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[12px] font-medium text-slate-600">{b.label}</span>
                    <span className={`text-[13px] font-bold ${b.textClass}`}>{b.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${b.barClass} transition-all`}
                      style={{ width: `${b.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5 pb-5">
            <button
              onClick={handleExport}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F172A] text-white text-[12px] font-bold tracking-wide hover:bg-slate-800 transition-colors"
            >
              <BarChart2 size={14} /> Generate Risk Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
