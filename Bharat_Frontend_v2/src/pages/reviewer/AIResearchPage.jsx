import {
  Brain,
  ShieldWarning,
  Microscope,
  Clock,
  ArrowsLeftRight,
  Eye,
  ArrowRight,
  CaretDoubleRight,
  X,
  CheckCircle
} from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { supabase } from "../../lib/supabase";

export function AIResearchPage({ caseData, editMode = false, editedPlan = null, setEditedPlan = null }) {
  const [animateRisk, setAnimateRisk] = useState(false);
  const [isAnalyzingRisk, setIsAnalyzingRisk] = useState(true);

  useEffect(() => {
    setAnimateRisk(false);
    setIsAnalyzingRisk(true);
    const timer = setTimeout(() => {
      setIsAnalyzingRisk(false);
      setTimeout(() => setAnimateRisk(true), 50);
    }, 1500);
    return () => clearTimeout(timer);
  }, [caseData]);

  const baseData = caseData?.extracted_data || {};
  const innerData = baseData.extracted_data || {};
  const extractedData = { ...caseData, ...baseData, ...innerData };

  const handleExport = async () => {
    try {
      if (!caseData?.id) {
        alert("Case ID is missing.");
        return;
      }

      const { data, error } = await supabase
        .from('extractions')
        .select('*')
        .eq('case_id', caseData.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching extractions:", error);
        alert("Failed to fetch extraction data.");
        return;
      }

      let exportData = [];

      if (data && data.extracted_json) {
        // Only export the extracted_json object as requested
        exportData = [data.extracted_json];
      } else {
        const dataToExport = extractedData?.action_plan || extractedData || {};
        exportData = [dataToExport];
      }

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Extractions");
      
      const fileName = `extractions_${caseData?.case_id || "unknown"}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (err) {
      console.error("Export error:", err);
      alert("An error occurred during export.");
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full bg-[#f8fafc] text-slate-800">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#0F172A] mb-2">Judgment Intelligence Report</h1>
          <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
            Deep neural analysis of Case {caseData?.case_id || 'Unknown'}. This system prioritizes operative directives through institutional semantic modeling.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button 
            onClick={handleExport}
            className="px-5 py-2.5 bg-white border border-slate-200 text-sm font-bold text-[#0F172A] hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Export RAW Data
          </button>
          {/* <button className="px-5 py-2.5 bg-[#0F172A] border border-[#0F172A] text-white text-sm font-bold hover:bg-slate-800 transition-colors">
            Finalize Review
          </button> */}
        </div>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* Legal Semantic Understanding */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-6">
            <Brain size={20} weight="bold" />
            <h2 className="text-lg font-bold text-[#0F172A]">Extracted Metadata</h2>
          </div>
          
          <div className="space-y-4 flex-1">
            <div className="bg-[#F8FAFC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CASE NUMBER</p>
                <p className="font-mono text-sm text-[#0F172A]">{extractedData?.case_number || "Undetected"}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 hidden sm:block shrink-0 mx-4" />
              <div className="flex-1 sm:text-right flex flex-col sm:items-end">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DECISION DATE</p>
                <span className="inline-block px-3 py-1 bg-[#ecfdf5] text-[#059669] text-xs font-bold">
                  {extractedData?.decision_date || "Undetected"}
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">COURT</p>
                <p className="font-mono text-sm text-[#0F172A]">{extractedData?.court || "Undetected"}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 hidden sm:block shrink-0 mx-4" />
              <div className="flex-1 sm:text-right flex flex-col sm:items-end">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">JUDGE</p>
                <span className="inline-block px-3 py-1 bg-[#fffbeb] text-[#d97706] text-xs font-bold">
                  {extractedData?.judge || "Undetected"}
                </span>
              </div>
            </div>

            <div className="bg-[#F8FAFC] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DEADLINE</p>
                <p className="font-mono text-sm text-[#0F172A]">{extractedData?.deadline || "Undetected"}</p>
              </div>
              <ArrowRight size={16} className="text-slate-300 hidden sm:block shrink-0 mx-4" />
              <div className="flex-1 sm:text-right flex flex-col sm:items-end">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">DEPARTMENT</p>
                <span className="inline-block px-3 py-1 bg-[#f1f5f9] text-[#475569] text-xs font-bold">
                  {extractedData?.department || "Undetected"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Risk Scoring Model */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <ShieldWarning size={20} weight="bold" />
            <h2 className="text-lg font-bold text-[#0F172A]">Risk Analyzer</h2>
          </div>
          
          <div className="flex flex-col items-center justify-center mb-12">
            <div className="relative w-32 h-32 flex items-center justify-center shrink-0">
              
              {isAnalyzingRisk && (
                <div className="absolute inset-0 flex flex-col items-center justify-center z-20 bg-white rounded-full">
                  <div className="w-8 h-8 border-4 border-slate-100 border-t-[#0F172A] rounded-full animate-spin"></div>
                  <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mt-3 animate-pulse">ANALYZING</span>
                </div>
              )}

              <svg className={`absolute inset-0 w-full h-full transform -rotate-90 transition-opacity duration-500 ${isAnalyzingRisk ? "opacity-0" : "opacity-100"}`} viewBox="0 0 128 128">
                {/* Background Ring */}
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="8" />
                {/* Progress Ring */}
                <circle cx="64" cy="64" r="56" fill="transparent" stroke="#0F172A" strokeWidth="8" strokeDasharray="351.85" strokeDashoffset={animateRisk ? `${351.85 - (351.85 * (extractedData?.priority === "High" ? 90 : extractedData?.priority === "Medium" ? 50 : 20)) / 100}` : "351.85"} className="transition-all duration-1000 ease-out" />
              </svg>
              <div className={`text-center z-10 flex flex-col items-center justify-center mt-1 transition-opacity duration-500 ${isAnalyzingRisk ? "opacity-0" : "opacity-100"}`}>
                <span className="block text-[32px] font-black text-[#0F172A] leading-none mb-1">{extractedData?.priority || "N/A"}</span>
                <span className="block text-[9px] font-bold text-slate-400 tracking-widest uppercase">PRIORITY</span>
              </div>
            </div>
            
            <div className={`transition-all duration-700 ease-out flex flex-col justify-center overflow-hidden w-full ${!isAnalyzingRisk ? "opacity-100 max-h-32 mt-6" : "opacity-0 max-h-0 mt-0"}`}>
              {extractedData?.priority_reasoning && (
                <div className="text-center px-2">
                  <p className="text-xs font-medium text-slate-600 leading-relaxed bg-[#f8fafc] border border-slate-100 p-3 rounded-sm">
                    {extractedData.priority_reasoning}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-5 px-1 mt-auto pb-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">Case Title</span>
              <span className="text-xs font-bold text-[#0F172A] flex-1 text-right truncate overflow-hidden whitespace-nowrap" title={extractedData?.case_title || "Unknown"}>{extractedData?.case_title || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">Petitioner</span>
              <span className="text-xs font-bold text-[#0F172A] flex-1 text-right truncate overflow-hidden whitespace-nowrap" title={extractedData?.petitioner || "Unknown"}>{extractedData?.petitioner || "Unknown"}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-medium text-slate-500 w-[120px] shrink-0">Respondent</span>
              <span className="text-xs font-bold text-[#0F172A] flex-1 text-right truncate overflow-hidden whitespace-nowrap" title={extractedData?.respondent || "Unknown"}>{extractedData?.respondent || "Unknown"}</span>
            </div>
          </div>
        </div>

        {/* Operative Section Detection */}
        <div className="bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Microscope size={20} weight="bold" />
              <h2 className="text-lg font-bold text-[#0F172A]">Operative Section Detection / Context</h2>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
              <span className="text-[10px] font-bold text-[#10b981] tracking-wider uppercase">Active Synthesis</span>
            </div>
          </div>
          
          <div className="bg-[#f8fafc] p-6 font-mono text-sm leading-relaxed border border-slate-100">
            <div className="relative border-2 border-[#0F172A] p-5 mb-4 bg-white shadow-sm">
              <div className="absolute -top-3 left-4 bg-[#0F172A] text-white text-[9px] font-bold px-2 py-0.5 tracking-wider uppercase">
                PRIMARY DIRECTIVE
              </div>
              <p className="font-bold text-[#0F172A]">
                "{extractedData?.primary_directive || extractedData?.summary || "No operative directives extracted."}"
              </p>
            </div>
            
            {extractedData?.directives?.length > 0 && (
              <div className="mt-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">ADDITIONAL DIRECTIVES</p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600 text-xs">
                  {extractedData.directives.map((dir, idx) => (
                    <li key={idx}>{dir}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Timeline Inference */}
        <div className="bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-8">
            <Clock size={20} weight="bold" />
            <h2 className="text-lg font-bold text-[#0F172A]">Timeline Inference</h2>
          </div>
          
          <div className="relative space-y-6">
            {/* Vertical Line */}
            <div className="absolute left-[5px] top-2 bottom-2 w-[2px] bg-slate-200"></div>

            {/* Timeline Item 1 */}
            <div className="relative flex gap-4">
              <div className="w-3 h-3 bg-[#0F172A] rounded-full ring-4 ring-white mt-1 shrink-0 z-10"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">START (T0)</p>
                <p className="font-bold text-[#0F172A] mb-0.5">{extractedData?.decision_date ? new Date(extractedData.decision_date).toLocaleDateString() : "Undetected"}</p>
                <p className="text-xs text-slate-500 italic">Inferred from: "{extractedData?.timeline_start_phrase || "System Extraction"}"</p>
              </div>
            </div>
            
            {/* Timeline Item 2 */}
            <div className="relative flex gap-4">
              <div className="w-3 h-3 bg-[#ef4444] rounded-full ring-4 ring-white mt-1 shrink-0 z-10"></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">DEADLINE (T0 + {extractedData?.deadline_days || "?"})</p>
                <p className="font-bold text-[#0F172A] mb-0.5">{extractedData?.deadline ? new Date(extractedData.deadline).toLocaleDateString() : "Undetected"}</p>
                <p className="text-xs text-slate-500 italic">Extracted: "within {extractedData?.deadline_days || "Unknown"} days"</p>
              </div>
            </div>
          </div>
        </div>

        {/* Semantic Understanding / Phrases */}
        <div className="bg-white border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <ArrowsLeftRight size={20} weight="bold" />
            <h2 className="text-lg font-bold text-[#0F172A]">Semantic Mapping</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {extractedData?.semantic_phrases?.length > 0 ? (
              extractedData.semantic_phrases.slice(0, 3).map((item, idx) => (
                <div key={idx} className="bg-[#F8FAFC] border border-slate-100 p-3 rounded">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">PHRASE</p>
                  <p className="text-sm font-mono text-slate-800 mb-2 line-clamp-2" title={item.phrase}>"{item.phrase}"</p>
                  <span className="inline-block px-2 border border-blue-200 py-1 bg-blue-50 text-blue-700 text-[10px] font-bold uppercase">{item.mapping}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic">No semantic phrases extracted.</p>
            )}
          </div>
        </div>

        {/* Context-Aware Extraction Action Plan */}
        <div className="bg-white border border-slate-200 shadow-sm p-6 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-6">
            <Eye size={20} weight="bold" />
            <h2 className="text-lg font-bold text-[#0F172A]">AI Action Plan Engine</h2>
          </div>
          
          <div className="flex flex-col gap-6">
            {/* Action Plan Summary */}
            <div className="flex flex-col md:flex-row items-stretch gap-6">
              <div className="flex-1 bg-[#fef2f2] border border-[#fecaca] p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#b91c1c] uppercase tracking-wider mb-3">SYSTEM DECISION</p>
                  <p className="text-xl font-bold text-[#991b1b] mb-4">{extractedData?.decision || "NO ACTION"}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-center text-slate-300">
                <CaretDoubleRight size={24} weight="bold" />
              </div>

              <div className="flex-1 bg-[#ecfdf5] border border-[#a7f3d0] p-5 flex flex-col justify-between">
                <div>
                  <p className="text-[10px] font-bold text-[#047857] uppercase tracking-wider mb-3">REQUIRED ACTION STEPS</p>
                  {editMode && editedPlan ? (
                    <textarea
                      value={editedPlan.summary_directive || ""}
                      onChange={(e) => setEditedPlan({ ...editedPlan, summary_directive: e.target.value })}
                      rows={3}
                      className="w-full text-sm font-medium text-slate-700 bg-white border border-[#a7f3d0] p-2 focus:outline-none focus:ring-1 focus:ring-[#047857] resize-none"
                      placeholder="Summary directive..."
                    />
                  ) : (
                    <p className="text-sm font-medium text-slate-700 mb-4">{extractedData?.action_plan?.summary_directive || extractedData?.required_action || "Manual review needed."}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[#047857] text-xs font-bold">
                  <CheckCircle size={14} weight="bold" />
                  Confidence Score: {extractedData?.extraction_confidence ? extractedData.extraction_confidence + "/10" : "N/A"}
                </div>
              </div>
            </div>

            {/* AI Generated Tasks */}
            {editMode && editedPlan ? (
              <div className="mt-4 border-t border-slate-100 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Compliance Steps</h3>
                  <button
                    onClick={() => setEditedPlan({
                      ...editedPlan,
                      tasks: [...(editedPlan.tasks || []), {
                        step: (editedPlan.tasks?.length || 0) + 1,
                        description: "",
                        assigned_to: "",
                        is_mandatory: true,
                        deadline_offset_days: 7,
                      }]
                    })}
                    className="text-xs font-bold text-[#047857] border border-[#a7f3d0] px-3 py-1.5 hover:bg-[#ecfdf5] transition-colors cursor-pointer"
                  >
                    + Add Step
                  </button>
                </div>
                <div className="space-y-3">
                  {(editedPlan.tasks || []).map((task, idx) => (
                    <div key={idx} className="flex gap-3 p-4 border border-slate-200 bg-slate-50 items-start">
                      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-xs mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <input
                          value={task.description}
                          onChange={(e) => {
                            const updated = [...editedPlan.tasks];
                            updated[idx] = { ...updated[idx], description: e.target.value };
                            setEditedPlan({ ...editedPlan, tasks: updated });
                          }}
                          className="w-full text-sm font-bold text-slate-800 bg-white border border-slate-200 px-2 py-1.5 focus:outline-none focus:border-slate-400"
                          placeholder="Task description"
                        />
                        <div className="flex gap-2">
                          <input
                            value={task.assigned_to}
                            onChange={(e) => {
                              const updated = [...editedPlan.tasks];
                              updated[idx] = { ...updated[idx], assigned_to: e.target.value };
                              setEditedPlan({ ...editedPlan, tasks: updated });
                            }}
                            className="flex-1 text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1.5 focus:outline-none focus:border-slate-400"
                            placeholder="Assigned to"
                          />
                          <input
                            type="number"
                            value={task.deadline_offset_days}
                            onChange={(e) => {
                              const updated = [...editedPlan.tasks];
                              updated[idx] = { ...updated[idx], deadline_offset_days: parseInt(e.target.value) || 0 };
                              setEditedPlan({ ...editedPlan, tasks: updated });
                            }}
                            className="w-20 text-xs text-slate-600 bg-white border border-slate-200 px-2 py-1.5 focus:outline-none focus:border-slate-400"
                            placeholder="Days"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          const updated = editedPlan.tasks.filter((_, i) => i !== idx).map((t, i) => ({ ...t, step: i + 1 }));
                          setEditedPlan({ ...editedPlan, tasks: updated });
                        }}
                        className="text-slate-400 hover:text-[#dc2626] transition-colors mt-0.5 cursor-pointer"
                      >
                        <X size={14} weight="bold" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              extractedData?.action_plan?.tasks && extractedData.action_plan.tasks.length > 0 && (
                <div className="mt-4 border-t border-slate-100 pt-6">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider">Generated Compliance Steps</h3>
                  <div className="space-y-3">
                    {extractedData.action_plan.tasks.map((task, idx) => (
                      <div key={idx} className="flex gap-4 p-4 border border-slate-100 bg-slate-50 items-center">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-bold text-sm">
                          {task.step}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-800">{task.description}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Assigned to: <span className="font-semibold">{task.assigned_to}</span> 
                            <span className="mx-2">•</span>
                            Target Deadline: T0 + {task.deadline_offset_days} Days
                          </p>
                        </div>
                        <div>
                          {task.is_mandatory && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold uppercase rounded">
                              Mandatory
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
