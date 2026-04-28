"use client";
import { useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import type { Task, SelectOption } from "./types";
import { IP_TYPES, IP_ACTIONS_BY_TYPE } from "./types";
import { BackButton } from "./TaskLanding";
import { ACTION_FIELDS } from "@/lib/countries";

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

export default function IPSection({
  tasks, clients, projects, lawyers, agents,
  onBack, onCreateTask, onSelectTask, onUpdateStatus
}: Props) {
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    title: "", description: "", ipType: "", ipAction: "",
    actionDetails: {} as Record<string, any>,
    clientId: "", projectId: "", dueDate: "",
    assigneeIds: [] as number[], isAgent: false, agentId: "", separateAccount: false,
    billingType: "HOURS", billingCurrency: "USD",
    hourlyRate: "", retainerHours: "", retainerFee: "", overtimeRate: "",
  });

  const ipTasks = useMemo(() => {
    const s = search.toLowerCase();
    return tasks.filter(t => t.taskType === "IP" &&
      (!s || t.title.toLowerCase().includes(s) || t.ipType?.toLowerCase()?.includes(s))
    );
  }, [tasks, search]);

  const handleSubmit = async () => {
    await onCreateTask({
      ...form,
      taskType: "IP",
      clientId: form.clientId ? parseInt(form.clientId) : undefined,
      projectId: form.projectId ? parseInt(form.projectId) : undefined,
      agentId: form.isAgent && form.agentId ? parseInt(form.agentId) : undefined,
      separateAccount: form.separateAccount,
      billingType: form.billingType,
      billingCurrency: form.billingCurrency,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      retainerHours: form.retainerHours ? parseFloat(form.retainerHours) : undefined,
      retainerFee: form.retainerFee ? parseFloat(form.retainerFee) : undefined,
      overtimeRate: form.overtimeRate ? parseFloat(form.overtimeRate) : undefined,
    });
    setForm({ title: "", description: "", ipType: "", ipAction: "", actionDetails: {},
      clientId: "", projectId: "", dueDate: "", assigneeIds: [], isAgent: false, agentId: "", separateAccount: false,
      billingType: "HOURS", billingCurrency: "USD", hourlyRate: "", retainerHours: "", retainerFee: "", overtimeRate: "" });
    setShowForm(false);
  };

  return (
    <div>
      <BackButton onClick={onBack} label="Categories" />
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-serif font-bold">Intellectual Property</h2>
        <button onClick={() => setShowForm(true)} className="btn-legal flex items-center gap-2">
          <Plus className="w-4 h-4" /> New IP Task
        </button>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input type="text" placeholder="Search IP tasks..." value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm" />
      </div>

      <div className="space-y-3">
        {ipTasks.length === 0 && (
          <div className="text-center py-16 text-slate-500">
            <p className="text-lg mb-2">No IP tasks yet</p>
            <p className="text-sm">Click &quot;New IP Task&quot; to create one</p>
          </div>
        )}
        {ipTasks.map(t => (
          <div key={t.id} onClick={() => onSelectTask(t)}
            className="legal-card p-4 cursor-pointer flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium truncate">{t.title}</h4>
              <div className="flex gap-3 text-xs text-slate-500 mt-1">
                {t.ipType && <span className="bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded">{t.ipType.replace(/_/g, ' ')}</span>}
                {t.ipAction && <span>{t.ipAction}</span>}
                <span>{new Date(t.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium shrink-0 ${
              t.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-400' :
              t.status === 'IN_PROGRESS' ? 'bg-amber-500/20 text-amber-400' :
              'bg-slate-500/20 text-slate-400'
            }`}>{t.status.replace('_', ' ')}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowForm(false)}>
          <div className="legal-card w-full max-w-lg p-6 max-h-[85vh] overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-serif font-bold mb-6">New IP Task</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Title *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm" placeholder="Task title" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Description</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm" rows={2} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">IP Type *</label>
                <select value={form.ipType} onChange={e => setForm({ ...form, ipType: e.target.value, ipAction: "", actionDetails: {} })}
                  className="w-full rounded-lg px-3 py-2 text-sm">
                  <option value="">Select IP Type</option>
                  {IP_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </div>
              {form.ipType && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Action</label>
                  <select value={form.ipAction}
                    onChange={e => setForm({ ...form, ipAction: e.target.value, actionDetails: {} })}
                    className="w-full rounded-lg px-3 py-2 text-sm">
                    <option value="">Select Action</option>
                    {(IP_ACTIONS_BY_TYPE[form.ipType] || []).map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              )}
              {form.ipAction && form.ipType && ACTION_FIELDS[form.ipType]?.[form.ipAction] && (
                <div className="border border-white/10 p-3 rounded-lg space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                  <p className="font-medium text-sm text-slate-300 sticky top-0">{form.ipAction} Details</p>
                  {ACTION_FIELDS[form.ipType][form.ipAction].map((field: any) => {
                    const shouldShow = !field.dependsOn || form.actionDetails[field.dependsOn.field] === field.dependsOn.value;
                    if (!shouldShow) return null;
                    return (
                      <div key={field.name}>
                        {field.type === "select" && (
                          <select className="w-full rounded-lg px-3 py-2 text-sm"
                            value={form.actionDetails[field.name] || ""}
                            onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}>
                            <option value="">{field.label}</option>
                            {field.options?.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        )}
                        {field.type === "text" && (
                          <input type="text" className="w-full rounded-lg px-3 py-2 text-sm" placeholder={field.label}
                            value={form.actionDetails[field.name] || ""}
                            onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })} />
                        )}
                        {field.type === "date" && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                            <input type="date" className="w-full rounded-lg px-3 py-2 text-sm"
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })} />
                          </div>
                        )}
                        {field.type === "textarea" && (
                          <textarea className="w-full rounded-lg px-3 py-2 text-sm" placeholder={field.label} rows={2}
                            value={form.actionDetails[field.name] || ""}
                            onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })} />
                        )}
                        {field.type === "number" && (
                          <input type="number" className="w-full rounded-lg px-3 py-2 text-sm" placeholder={field.label}
                            value={form.actionDetails[field.name] || ""}
                            onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })} />
                        )}
                        {field.type === "boolean" && (
                          <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={form.actionDetails[field.name] || false}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.checked } })} />
                            {field.label}
                          </label>
                        )}
                        {field.type === "file" && (
                          <div>
                            <label className="block text-xs text-slate-400 mb-1">{field.label}</label>
                            <input type="file" className="w-full" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
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
                  <div className="col-span-2 bg-white/5 border border-white/10 p-3 rounded-lg flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      id="separateAccountIP" 
                      checked={form.separateAccount || !form.projectId} 
                      disabled={!form.projectId}
                      onChange={e => setForm({ ...form, separateAccount: e.target.checked })} 
                      className="accent-legal-gold w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="separateAccountIP" className="text-sm text-slate-300 cursor-pointer">
                      {!form.projectId ? "An independent revenue account will be created automatically" : "Create a separate independent revenue account for this matter"}
                    </label>
                  </div>
                )}

                {/* Billing Options for separate account */}
                {(form.separateAccount || !form.projectId) && form.clientId && (
                  <div className="col-span-2 space-y-4 border-t border-white/10 pt-4 mt-2">
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
              <div>
                <label className="block text-xs text-slate-400 mb-1">Due Date *</label>
                <input type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-2">Assign Lawyers *</label>
                <div className="max-h-28 overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2">
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
              <div className="flex items-center gap-2">
                <input type="checkbox" id="ipIsAgent" checked={form.isAgent}
                  onChange={e => setForm({ ...form, isAgent: e.target.checked, agentId: "" })} />
                <label htmlFor="ipIsAgent" className="text-sm">Assign to Agent?</label>
              </div>
              {form.isAgent && (
                <select value={form.agentId} onChange={e => setForm({ ...form, agentId: e.target.value })}
                  className="w-full rounded-lg px-3 py-2 text-sm">
                  <option value="">Select Agent</option>
                  {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="btn-legal-outline px-5 py-2">Cancel</button>
              <button onClick={handleSubmit}
                disabled={!form.title?.trim() || form.assigneeIds.length === 0 || !form.dueDate}
                className="btn-legal px-5 py-2 disabled:opacity-40">Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
