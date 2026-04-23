"use client";
import { useState } from "react";
import { X } from "lucide-react";
import type { Task } from "./types";
import { LITIGATION_CATEGORIES, LITIGATION_TYPES, LITIGATION_TABS } from "./types";
import { ACTION_FIELDS } from "@/lib/countries";

interface Props {
  task: Task;
  onClose: () => void;
}

export default function TaskDetailModal({ task, onClose }: Props) {
  const [tab, setTab] = useState<"info" | "litigation" | "ip">("info");

  const isLitigation = task.taskType === "LITIGATION";
  const isIP = task.taskType === "IP";

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="legal-card w-full max-w-2xl p-6 max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-serif font-bold">Task Details</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
          <button onClick={() => setTab("info")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "info" ? "bg-white/10 text-white" : "text-slate-500 hover:text-white"
            }`}>General Info</button>
          {isLitigation && (
            <button onClick={() => setTab("litigation")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "litigation" ? "bg-rose-500/20 text-rose-400" : "text-slate-500 hover:text-white"
              }`}>Case Details</button>
          )}
          {isIP && (
            <button onClick={() => setTab("ip")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === "ip" ? "bg-violet-500/20 text-violet-400" : "text-slate-500 hover:text-white"
              }`}>IP Details</button>
          )}
        </div>

        {/* Info Tab */}
        {tab === "info" && (
          <div className="space-y-5">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Title</p>
              <p className="font-medium text-lg">{task.title}</p>
            </div>
            {task.description && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</p>
                <p className="text-slate-300">{task.description}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Category</p>
                <p className="capitalize">{task.taskType?.toLowerCase() || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                  task.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                  task.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                  'bg-slate-500/20 text-slate-400'
                }`}>{task.status.replace('_', ' ')}</span>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Client</p>
                <p>{task.client?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Project</p>
                <p>{task.project?.name || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Assignees</p>
                <p>{task.assignees?.map(a => a.name).join(", ") || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Due Date</p>
                <p>{new Date(task.dueDate).toLocaleDateString()}</p>
              </div>
              {task.agent && (
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Agent</p>
                  <p>{task.agent.name}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Litigation Tab */}
        {tab === "litigation" && isLitigation && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Litigation Category</p>
                <p>{LITIGATION_CATEGORIES.find(c => c.value === task.litigationCategory)?.label || task.litigationCategory || "-"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Litigation Type</p>
                <p>{LITIGATION_TYPES.find(t => t.value === task.litigationType)?.label || task.litigationType || "-"}</p>
              </div>
            </div>
            {task.caseType && <InfoRow label="Case Type" value={task.caseType} />}
            {task.caseNumber && <InfoRow label="Case Number" value={task.caseNumber} />}
            {task.courtAuthority && <InfoRow label="Court / Authority" value={task.courtAuthority} />}
            {task.parties && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Parties</p>
                <div className="grid grid-cols-2 gap-3 bg-white/5 rounded-lg p-3">
                  <div>
                    <p className="text-xs text-slate-500">Plaintiff</p>
                    <p className="text-sm">{task.parties.plaintiff || "-"}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Defendant</p>
                    <p className="text-sm">{task.parties.defendant || "-"}</p>
                  </div>
                </div>
              </div>
            )}
            {task.hearingDate && <InfoRow label="Hearing Date" value={new Date(task.hearingDate).toLocaleDateString()} />}
            {task.hearingRemarks && <InfoRow label="Hearing Remarks" value={task.hearingRemarks} />}
            {task.nextHearingDate && <InfoRow label="Next Hearing" value={new Date(task.nextHearingDate).toLocaleDateString()} />}
            {task.nextHearingRemarks && <InfoRow label="Next Hearing Remarks" value={task.nextHearingRemarks} />}
            {task.reminderDate && <InfoRow label="Reminder Date" value={new Date(task.reminderDate).toLocaleDateString()} />}
            {task.importantDates && task.importantDates.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Important Dates</p>
                <div className="space-y-1">
                  {task.importantDates.map((d: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm bg-white/5 rounded px-3 py-2">
                      <span>{d.label}</span>
                      <span className="text-slate-400">{d.date ? new Date(d.date).toLocaleDateString() : "-"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {task.decisions && (task.decisions as any[]).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Decisions</p>
                {(task.decisions as any[]).map((d, i) => (
                  <div key={i} className="bg-white/5 rounded px-3 py-2 mb-1 text-sm">
                    <span className="text-slate-400 mr-2">{d.date ? new Date(d.date).toLocaleDateString() : ""}</span>
                    {d.summary}
                  </div>
                ))}
              </div>
            )}
            {task.enforcement && (task.enforcement as any).status && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Enforcement</p>
                <p className="text-sm"><strong>{(task.enforcement as any).status}</strong> — {(task.enforcement as any).details}</p>
              </div>
            )}
          </div>
        )}

        {/* IP Tab */}
        {tab === "ip" && isIP && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="IP Type" value={task.ipType?.replace(/_/g, ' ') || "-"} />
              <InfoRow label="IP Action" value={task.ipAction || "-"} />
            </div>
            {task.actionDetails && Object.keys(task.actionDetails).length > 0 && (
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">{task.ipAction} Details</p>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(task.actionDetails).map(([key, value]) => {
                    const fieldDef = ACTION_FIELDS[task.ipAction || ""]?.find((f: any) => f.name === key);
                    const label = fieldDef?.label || key.replace(/([A-Z])/g, ' $1').replace(/^./g, (s: string) => s.toUpperCase());
                    let displayValue = String(value || "");
                    if (fieldDef?.type === "date" && value) displayValue = new Date(value).toLocaleDateString();
                    else if (fieldDef?.type === "boolean") displayValue = value ? "Yes" : "No";
                    else if (fieldDef?.type === "select" && fieldDef.options) {
                      const opt = fieldDef.options.find((o: any) => o.value === value);
                      displayValue = opt?.label || displayValue;
                    }
                    return <InfoRow key={key} label={label} value={displayValue || "-"} />;
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm">{value}</p>
    </div>
  );
}
