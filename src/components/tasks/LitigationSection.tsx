"use client";
import { useState, useMemo } from "react";
import { Plus, Search, ChevronRight, FileText } from "lucide-react";
import type { Task, SelectOption } from "./types";
import { LITIGATION_CATEGORIES, LITIGATION_TYPES, LITIGATION_TABS } from "./types";
import { BackButton } from "./TaskLanding";

interface Props {
  tasks: Task[];
  clients: SelectOption[];
  projects: SelectOption[];
  lawyers: SelectOption[];
  agents: SelectOption[];
  onBack: () => void;
  onCreateTask: (data: any) => Promise<void>;
  onSelectTask: (task: Task) => void;
  onUpdateStatus: (id: number, status: string) => void;
}

export default function LitigationSection({
  tasks, clients, projects, lawyers, agents,
  onBack, onCreateTask, onSelectTask, onUpdateStatus
}: Props) {
  const [litCat, setLitCat] = useState<string>("");
  const [litType, setLitType] = useState<string>("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");

  // Form state for litigation task
  const [form, setForm] = useState({
    title: "", description: "", clientId: "", projectId: "",
    dueDate: "", assigneeIds: [] as number[],
    isAgent: false, agentId: "",
    separateAccount: true,
    caseType: "", parties: { plaintiff: "", defendant: "", agents: [] as string[] },
    courtAuthority: "", caseNumber: "",
    importantDates: [{ label: "", date: "" }],
    filings: [{ title: "", date: "", fileUrl: "" }],
    hearingDate: "", hearingRemarks: "",
    nextHearingDate: "", nextHearingRemarks: "", reminderDate: "",
    decisions: [{ date: "", summary: "" }],
    appeals: [{ date: "", type: "", status: "" }],
    enforcement: { status: "", details: "" },
    billingType: "HOURS", billingCurrency: "USD",
    hourlyRate: "", retainerHours: "", retainerFee: "", overtimeRate: "",
  });

  const litTasks = useMemo(() => {
    return tasks.filter(t => {
      if (t.taskType !== "LITIGATION") return false;
      if (litCat && t.litigationCategory !== litCat) return false;
      if (litType && t.litigationType !== litType) return false;
      const s = search.toLowerCase();
      if (s && !t.title?.toLowerCase()?.includes(s)) return false;
      return true;
    });
  }, [tasks, litCat, litType, search]);

  const resetForm = () => {
    setForm({
      title: "", description: "", clientId: "", projectId: "",
      dueDate: "", assigneeIds: [], isAgent: false, agentId: "",
      caseType: "", parties: { plaintiff: "", defendant: "", agents: [] },
      courtAuthority: "", caseNumber: "",
      importantDates: [{ label: "", date: "" }],
      filings: [{ title: "", date: "", fileUrl: "" }],
      hearingDate: "", hearingRemarks: "",
      nextHearingDate: "", nextHearingRemarks: "", reminderDate: "",
      decisions: [{ date: "", summary: "" }],
      appeals: [{ date: "", type: "", status: "" }],
      enforcement: { status: "", details: "" },
      separateAccount: false,
      billingType: "HOURS", billingCurrency: "USD", hourlyRate: "", retainerHours: "", retainerFee: "", overtimeRate: "",
    });
  };

  const handleSubmit = async () => {
    await onCreateTask({
      title: form.title,
      description: form.description,
      taskType: "LITIGATION",
      litigationCategory: litCat,
      litigationType: litType,
      caseType: form.caseType,
      parties: form.parties,
      courtAuthority: form.courtAuthority,
      caseNumber: form.caseNumber,
      importantDates: form.importantDates.filter(d => d.label || d.date),
      filings: form.filings.filter(f => f.title || f.date),
      hearingDate: form.hearingDate || null,
      hearingRemarks: form.hearingRemarks,
      nextHearingDate: form.nextHearingDate || null,
      nextHearingRemarks: form.nextHearingRemarks,
      reminderDate: form.reminderDate || null,
      decisions: form.decisions.filter(d => d.date || d.summary),
      appeals: form.appeals.filter(a => a.date || a.type),
      enforcement: form.enforcement,
      clientId: form.clientId ? parseInt(form.clientId) : undefined,
      projectId: form.projectId ? parseInt(form.projectId) : undefined,
      assigneeIds: form.assigneeIds,
      dueDate: form.dueDate,
      isAgent: form.isAgent,
      agentId: form.isAgent && form.agentId ? parseInt(form.agentId) : undefined,
      separateAccount: form.separateAccount,
      billingType: form.billingType,
      billingCurrency: form.billingCurrency,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      retainerHours: form.retainerHours ? parseFloat(form.retainerHours) : undefined,
      retainerFee: form.retainerFee ? parseFloat(form.retainerFee) : undefined,
      overtimeRate: form.overtimeRate ? parseFloat(form.overtimeRate) : undefined,
    });
    resetForm();
    setShowForm(false);
  };

  // Step 1: Choose litigation category
  if (!litCat) {
    return (
      <div>
        <BackButton onClick={onBack} label="Categories" />
        <h2 className="text-2xl font-serif font-bold mb-8">Litigation</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl">
          {LITIGATION_CATEGORIES.map(c => (
            <button key={c.value} onClick={() => setLitCat(c.value)}
              className="legal-card p-8 text-left group hover:border-rose-500/30 transition-all">
              <h3 className="text-lg font-semibold mb-2">{c.label}</h3>
              <p className="text-slate-500 text-xs">
                {c.value === 'IP_LITIGATION' ? 'Intellectual property disputes' : 'Corporate legal disputes'}
              </p>
              <ChevronRight className="w-5 h-5 text-slate-600 mt-4 group-hover:text-rose-400 group-hover:translate-x-1 transition-all" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  // Step 2: Choose litigation type (dropdown shown in header)
  const catLabel = LITIGATION_CATEGORIES.find(c => c.value === litCat)?.label || litCat;

  return (
    <div>
      <BackButton onClick={() => { if (litType) { setLitType(""); } else { setLitCat(""); } }}
        label={litType ? catLabel : "Litigation"} />
      
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-serif font-bold">{catLabel}</h2>
          <select value={litType} onChange={e => setLitType(e.target.value)}
            className="rounded-lg px-3 py-2 text-sm min-w-[220px]">
            <option value="">All Types</option>
            {LITIGATION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        {litType && (
          <button onClick={() => setShowForm(true)} className="btn-legal flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Case
          </button>
        )}
      </div>

      {!litType && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
          {LITIGATION_TYPES.map(t => {
            const count = tasks.filter(tk => tk.taskType === "LITIGATION" && tk.litigationCategory === litCat && tk.litigationType === t.value).length;
            return (
              <button key={t.value} onClick={() => setLitType(t.value)}
                className="legal-card p-6 text-left group hover:border-rose-500/30 transition-all flex justify-between items-center">
                <div>
                  <h4 className="font-medium">{t.label}</h4>
                  <p className="text-xs text-slate-500 mt-1">{count} cases</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-rose-400 transition-colors" />
              </button>
            );
          })}
        </div>
      )}

      {litType && (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input type="text" placeholder="Search cases..." value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" />
          </div>

          {/* Task list */}
          <div className="space-y-3">
            {litTasks.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                <p>No cases found</p>
                <p className="text-sm mt-1">Click &quot;New Case&quot; to create one</p>
              </div>
            )}
            {litTasks.map(t => (
              <div key={t.id} onClick={() => onSelectTask(t)}
                className="legal-card p-4 cursor-pointer flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium truncate">{t.title}</h4>
                  <div className="flex gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    {t.caseNumber && <span>#{t.caseNumber}</span>}
                    {t.courtAuthority && <span>{t.courtAuthority}</span>}
                    <span>{new Date(t.dueDate).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
                    t.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
                    t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
                    'bg-slate-500/20 text-slate-400'
                  }`}>{t.status.replace('_', ' ')}</span>
                  {t.accountId && (
                    <button 
                      onClick={e => { e.stopPropagation(); window.location.href = `/dashboard/invoices/new?matterId=${t.id}`; }}
                      className="bg-amber-500/10 text-amber-500 p-1.5 rounded-lg hover:bg-amber-500/20 transition-all border border-amber-500/20"
                      title="Generate Invoice"
                    >
                      <FileText className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Create form modal with 12 sub-tabs */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="legal-card w-full max-w-3xl p-6 max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-serif font-bold mb-4">
              New {catLabel} — {LITIGATION_TYPES.find(t => t.value === litType)?.label}
            </h3>

            {/* Basic info row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Case title" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>

            {/* Form content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-8 pr-2 min-h-[200px]">
              
              {/* 1. Case Details */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">1. Case Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Client</label>
                    <select value={form.clientId} onChange={e => setForm({ ...form, clientId: e.target.value, projectId: "" })}
                      className="w-full rounded-lg px-3 py-2 text-sm">
                      <option value="">Select Client</option>
                      {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Project</label>
                    <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" disabled={!form.clientId}>
                      <option value="">Select Project</option>
                      {projects.filter(p => !form.clientId || p.clientId === parseInt(form.clientId)).map(p =>
                        <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>

                {form.clientId && (
                  <div className="col-span-1 sm:col-span-2 bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-2 mb-2">
                    <input 
                      type="checkbox" 
                      id="separateAccount" 
                      checked={form.separateAccount} 
                      onChange={e => setForm({ ...form, separateAccount: e.target.checked })} 
                      className="accent-legal-gold w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="separateAccount" className="text-sm font-bold text-amber-500 cursor-pointer flex items-center gap-2">
                      <FileText className="w-4 h-4 shrink-0" />
                      <span>{!form.projectId ? "Independent billing account will be created" : "Enable independent billing for this matter?"}</span>
                    </label>
                  </div>
                )}

                {/* Billing Options for separate account */}
                {(form.separateAccount || !form.projectId) && form.clientId && (
                    <div className="col-span-1 sm:col-span-2 space-y-4 border-t border-white/10 pt-4 mt-2">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Billing Type</label>
                          <select value={form.billingType} onChange={e => setForm({ ...form, billingType: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800">
                            <option value="HOURS">Hourly Rate</option>
                            <option value="FIXED">Fixed Fee</option>
                            <option value="CAPPED_RETAINER">Capped Retainer</option>
                            <option value="OPEN_RETAINER">Open Retainer</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Currency</label>
                          <select value={form.billingCurrency} onChange={e => setForm({ ...form, billingCurrency: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800">
                            <option value="USD">USD</option>
                            <option value="EGP">EGP</option>
                            <option value="EUR">EUR</option>
                            <option value="GBP">GBP</option>
                            <option value="SAR">SAR</option>
                            <option value="AED">AED</option>
                          </select>
                        </div>
                      </div>

                      {(form.billingType === 'HOURS' || form.billingType === 'FIXED' || form.billingType === 'OPEN_RETAINER') && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">
                            {form.billingType === 'HOURS' ? 'Hourly Rate' : form.billingType === 'FIXED' ? 'Fixed Amount' : 'Standard Hourly Rate (After Retainer)'}
                          </label>
                          <input type="number" value={form.hourlyRate} onChange={e => setForm({ ...form, hourlyRate: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800" placeholder="0.00" />
                        </div>
                      )}

                      {(form.billingType === 'CAPPED_RETAINER' || form.billingType === 'OPEN_RETAINER') && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Retainer Fee</label>
                            <input type="number" value={form.retainerFee} onChange={e => setForm({ ...form, retainerFee: e.target.value })}
                              className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800" placeholder="0.00" />
                          </div>
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">Included Hours</label>
                            <input type="number" value={form.retainerHours} onChange={e => setForm({ ...form, retainerHours: e.target.value })}
                              className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800" placeholder="0" />
                          </div>
                        </div>
                      )}

                      {form.billingType === 'CAPPED_RETAINER' && (
                        <div>
                          <label className="block text-xs text-slate-400 mb-1">Overtime Hourly Rate</label>
                          <input type="number" value={form.overtimeRate} onChange={e => setForm({ ...form, overtimeRate: e.target.value })}
                            className="w-full rounded-lg px-3 py-2 text-sm bg-slate-800" placeholder="0.00" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Case Type</label>
                    <input value={form.caseType} onChange={e => setForm({ ...form, caseType: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="e.g. Contract Dispute" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Court / Authority</label>
                    <input value={form.courtAuthority}
                      onChange={e => setForm({ ...form, courtAuthority: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Court name" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Case Number</label>
                    <input value={form.caseNumber}
                      onChange={e => setForm({ ...form, caseNumber: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Case #" />
                  </div>
                </div>
              </div>

              {/* 2. Parties */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">2. Parties</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Plaintiff</label>
                    <input value={form.parties.plaintiff}
                      onChange={e => setForm({ ...form, parties: { ...form.parties, plaintiff: e.target.value } })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Plaintiff name" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Defendant</label>
                    <input value={form.parties.defendant}
                      onChange={e => setForm({ ...form, parties: { ...form.parties, defendant: e.target.value } })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Defendant name" />
                  </div>
                </div>
              </div>

              {/* 3. Important Dates */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">3. Important Dates</h4>
                <div className="space-y-3">
                  {form.importantDates.map((d, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <input value={d.label}
                        onChange={e => { const arr = [...form.importantDates]; arr[i] = { ...arr[i], label: e.target.value }; setForm({ ...form, importantDates: arr }); }}
                        className="rounded-lg px-3 py-2 text-sm" placeholder="Label (e.g. Filing Deadline)" />
                      <input type="date" value={d.date}
                        onChange={e => { const arr = [...form.importantDates]; arr[i] = { ...arr[i], date: e.target.value }; setForm({ ...form, importantDates: arr }); }}
                        className="rounded-lg px-3 py-2 text-sm" />
                    </div>
                  ))}
                  <button onClick={() => setForm({ ...form, importantDates: [...form.importantDates, { label: "", date: "" }] })}
                    className="text-xs text-rose-400 hover:text-rose-300">+ Add Date</button>
                </div>
              </div>

              {/* 4. Hearings & Reminders */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">4. Hearings & Reminders</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Hearing Date</label>
                    <input type="date" value={form.hearingDate}
                      onChange={e => setForm({ ...form, hearingDate: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Hearing Remarks</label>
                    <input value={form.hearingRemarks}
                      onChange={e => setForm({ ...form, hearingRemarks: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Remarks..." />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Next Hearing Date</label>
                    <input type="date" value={form.nextHearingDate}
                      onChange={e => setForm({ ...form, nextHearingDate: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Next Hearing Remarks</label>
                    <input value={form.nextHearingRemarks}
                      onChange={e => setForm({ ...form, nextHearingRemarks: e.target.value })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Remarks..." />
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Reminder Date (notification + email)</label>
                  <input type="date" value={form.reminderDate}
                    onChange={e => setForm({ ...form, reminderDate: e.target.value })}
                    className="w-full sm:w-1/2 rounded-lg px-3 py-2 text-sm" />
                  <p className="text-xs text-slate-600 mt-1">A notification and email will be sent to all assignees on this date</p>
                </div>
              </div>

              {/* 5. Filings & Documents */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">5. Filings & Documents</h4>
                <div className="space-y-4">
                  <div className="space-y-3">
                    <label className="block text-xs text-slate-400">Filings Log</label>
                    {form.filings.map((f, i) => (
                      <div key={i} className="grid grid-cols-2 gap-2">
                        <input value={f.title}
                          onChange={e => { const arr = [...form.filings]; arr[i] = { ...arr[i], title: e.target.value }; setForm({ ...form, filings: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" placeholder="Filing title" />
                        <input type="date" value={f.date}
                          onChange={e => { const arr = [...form.filings]; arr[i] = { ...arr[i], date: e.target.value }; setForm({ ...form, filings: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button onClick={() => setForm({ ...form, filings: [...form.filings, { title: "", date: "", fileUrl: "" }] })}
                      className="text-xs text-rose-400 hover:text-rose-300">+ Add Filing</button>
                  </div>
                  
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Upload Documents</label>
                    <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center">
                      <input type="file" multiple className="w-full" />
                      <p className="text-xs text-slate-500 mt-2">Drag & drop files or click to browse</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Decisions & Appeals */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">6. Decisions & Appeals</h4>
                <div className="space-y-6">
                  <div className="space-y-3">
                    <label className="block text-xs text-slate-400">Decisions</label>
                    {form.decisions.map((d, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2">
                        <input type="date" value={d.date}
                          onChange={e => { const arr = [...form.decisions]; arr[i] = { ...arr[i], date: e.target.value }; setForm({ ...form, decisions: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" />
                        <input value={d.summary} className="col-span-2 rounded-lg px-3 py-2 text-sm" placeholder="Decision Summary"
                          onChange={e => { const arr = [...form.decisions]; arr[i] = { ...arr[i], summary: e.target.value }; setForm({ ...form, decisions: arr }); }} />
                      </div>
                    ))}
                    <button onClick={() => setForm({ ...form, decisions: [...form.decisions, { date: "", summary: "" }] })}
                      className="text-xs text-rose-400 hover:text-rose-300">+ Add Decision</button>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs text-slate-400">Appeals</label>
                    {form.appeals.map((a, i) => (
                      <div key={i} className="grid grid-cols-3 gap-2">
                        <input type="date" value={a.date}
                          onChange={e => { const arr = [...form.appeals]; arr[i] = { ...arr[i], date: e.target.value }; setForm({ ...form, appeals: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" />
                        <input value={a.type} placeholder="Appeal Type"
                          onChange={e => { const arr = [...form.appeals]; arr[i] = { ...arr[i], type: e.target.value }; setForm({ ...form, appeals: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" />
                        <input value={a.status} placeholder="Status"
                          onChange={e => { const arr = [...form.appeals]; arr[i] = { ...arr[i], status: e.target.value }; setForm({ ...form, appeals: arr }); }}
                          className="rounded-lg px-3 py-2 text-sm" />
                      </div>
                    ))}
                    <button onClick={() => setForm({ ...form, appeals: [...form.appeals, { date: "", type: "", status: "" }] })}
                      className="text-xs text-rose-400 hover:text-rose-300">+ Add Appeal</button>
                  </div>
                </div>
              </div>

              {/* 7. Enforcement */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1">7. Enforcement</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Enforcement Status</label>
                    <input value={form.enforcement.status}
                      onChange={e => setForm({ ...form, enforcement: { ...form.enforcement, status: e.target.value } })}
                      className="w-full rounded-lg px-3 py-2 text-sm" placeholder="e.g. Pending, Enforced" />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Details</label>
                    <textarea value={form.enforcement.details}
                      onChange={e => setForm({ ...form, enforcement: { ...form.enforcement, details: e.target.value } })}
                      className="w-full rounded-lg px-3 py-2 text-sm" rows={2} placeholder="Enforcement details..." />
                  </div>
                </div>
              </div>

              {/* 8. Assign Lawyers */}
              <div>
                <h4 className="text-sm font-semibold text-rose-400 mb-3 border-b border-white/10 pb-1 mt-4">8. Assign Lawyers</h4>
                <div className="mt-3">
                  <label className="block text-xs text-slate-400 mb-2">Assign Lawyers *</label>
                  <div className="max-h-32 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2 bg-black/20">
                    {lawyers.map(l => (
                      <label key={l.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-white/5 p-1 rounded">
                        <input type="checkbox" checked={form.assigneeIds.includes(l.id)}
                          onChange={e => setForm({
                            ...form,
                            assigneeIds: e.target.checked ? [...form.assigneeIds, l.id] : form.assigneeIds.filter(id => id !== l.id)
                          })} />
                        {l.name}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center mt-4 pt-4 border-t border-white/10 gap-3">
              <button onClick={() => { resetForm(); setShowForm(false); }} className="btn-legal-outline px-5 py-2">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!form.title?.trim() || form.assigneeIds.length === 0 || !form.dueDate}
                className="btn-legal px-5 py-2 disabled:opacity-40">
                Create Case
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
