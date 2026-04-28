"use client";
import { useState } from "react";
import { X, Plus, Trash2, Save, Upload, Info } from "lucide-react";
import type { SelectOption } from "./types";
import toast from "react-hot-toast";

interface Props {
  clients: SelectOption[];
  projects: SelectOption[];
  lawyers: SelectOption[];
  onClose: () => void;
  onSave: (tasks: any[]) => Promise<void>;
}

export default function BulkTaskModal({ clients, projects, lawyers, onClose, onSave }: Props) {
  const [rows, setRows] = useState<any[]>([
    { id: Date.now(), country: "", trademark: "", appNo: "", filingDate: "", classes: "", status: "Under examination", applicant: "" }
  ]);
  const [common, setCommon] = useState({
    clientId: "",
    projectId: "",
    assigneeIds: [] as number[],
    ipType: "TRADEMARK",
    ipAction: "Application filing",
  });

  const addRow = () => {
    setRows([...rows, { id: Date.now(), country: "", trademark: rows[rows.length-1]?.trademark || "", appNo: "", filingDate: "", classes: "", status: "Under examination", applicant: rows[rows.length-1]?.applicant || "" }]);
  };

  const removeRow = (id: number) => {
    if (rows.length > 1) setRows(rows.filter(r => r.id !== id));
  };

  const updateRow = (id: number, field: string, value: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      if (lines.length < 2) return;
      
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase().replace(/\s/g, ""));
      const newRows: any[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });
        
        newRows.push({
          id: Date.now() + i,
          country: row.country || row.jurisdiction || "",
          trademark: row.trademark || row.name || row.mark || "",
          appNo: row.applicationno || row.appno || row.filenumber || "",
          filingDate: row.filingdate || row.date || "",
          classes: row.classes || row.class || "",
          status: row.status || "Under examination",
          applicant: row.applicantname || row.applicant || ""
        });
      }
      setRows(newRows);
      toast.success(`Imported ${newRows.length} rows from file`);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    const tasks = rows.map(r => ({
      title: `${r.trademark} - ${r.country || 'New Application'}`,
      taskType: "IP",
      ipType: common.ipType,
      ipAction: common.ipAction,
      clientId: parseInt(common.clientId),
      projectId: parseInt(common.projectId),
      dueDate: r.filingDate || new Date().toISOString(),
      assigneeIds: common.assigneeIds,
      actionDetails: {
        country: r.country,
        trademark: r.trademark,
        applicationNumber: r.appNo,
        applicationDate: r.filingDate,
        niceClasses: r.classes,
        trademarkStatus: r.status,
        applicantName: r.applicant
      }
    }));
    await onSave(tasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[200] p-4">
      <div className="bg-[#0a0f1a] border border-white/10 rounded-2xl w-full max-w-6xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/5">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-2xl font-serif font-bold text-white">Bulk Matter Entry</h2>
              <p className="text-sm text-slate-400 mt-1">Add multiple trademark applications at once</p>
            </div>
            <label className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer text-sm text-slate-300 transition-all ml-4">
              <Upload className="w-4 h-4 text-legal-gold" /> Upload Excel/CSV
              <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
            </label>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        {/* Common Settings */}
        <div className="p-6 bg-white/[0.02] border-b border-white/5 grid grid-cols-4 gap-4">
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Client</label>
            <select value={common.clientId} onChange={e => setCommon({...common, clientId: e.target.value})}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-legal-gold/50 outline-none transition-all">
              <option value="">Select Client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Project</label>
            <select value={common.projectId} onChange={e => setCommon({...common, projectId: e.target.value})}
              className="w-full bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-legal-gold/50 outline-none transition-all">
              <option value="">Select Project</option>
              {projects.filter(p => !common.clientId || p.clientId === parseInt(common.clientId)).map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
             <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1.5">Default Action</label>
             <div className="flex gap-2">
                <select value={common.ipAction} onChange={e => setCommon({...common, ipAction: e.target.value})}
                  className="flex-1 bg-[#1a1f2e] border border-white/10 rounded-xl px-3 py-2.5 text-sm focus:border-legal-gold/50 outline-none transition-all">
                  <option value="Application filing">Application filing</option>
                  <option value="Trademark search">Trademark search</option>
                </select>
                <div className="bg-violet-500/10 text-violet-400 px-4 py-2.5 rounded-xl border border-violet-500/20 text-xs font-bold flex items-center">
                  IP / TRADEMARK
                </div>
             </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-auto p-0 custom-scrollbar">
          <table className="w-full border-collapse text-left">
            <thead className="sticky top-0 bg-[#121826] z-10">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Country</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Trademark</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">App No.</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Filing Date</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Classes</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Status</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10">Applicant</th>
                <th className="px-4 py-3 text-[10px] uppercase tracking-widest text-slate-500 border-b border-white/10 w-16"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="p-2">
                    <input value={row.country} onChange={e => updateRow(row.id, "country", e.target.value)}
                      placeholder="e.g. Egypt" className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm" />
                  </td>
                  <td className="p-2">
                    <input value={row.trademark} onChange={e => updateRow(row.id, "trademark", e.target.value)}
                      placeholder="Trademark Name" className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm font-medium" />
                  </td>
                  <td className="p-2">
                    <input value={row.appNo} onChange={e => updateRow(row.id, "appNo", e.target.value)}
                      placeholder="N/A" className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm" />
                  </td>
                  <td className="p-2">
                    <input type="date" value={row.filingDate} onChange={e => updateRow(row.id, "filingDate", e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm [color-scheme:dark]" />
                  </td>
                  <td className="p-2">
                    <input value={row.classes} onChange={e => updateRow(row.id, "classes", e.target.value)}
                      placeholder="36, 9" className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm" />
                  </td>
                  <td className="p-2">
                    <select value={row.status} onChange={e => updateRow(row.id, "status", e.target.value)}
                      className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm">
                      <option value="Under examination">Under examination</option>
                      <option value="Published">Published</option>
                      <option value="Registered">Registered</option>
                      <option value="Renewed">Renewed</option>
                      <option value="Opposed">Opposed</option>
                    </select>
                  </td>
                  <td className="p-2">
                    <input value={row.applicant} onChange={e => updateRow(row.id, "applicant", e.target.value)}
                      placeholder="Applicant Co." className="w-full bg-transparent border-none focus:ring-1 focus:ring-legal-gold/30 rounded px-2 py-1.5 text-sm" />
                  </td>
                  <td className="p-2 text-center">
                    <button onClick={() => removeRow(row.id)} className="p-1.5 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addRow} className="w-full py-4 text-slate-500 hover:text-legal-gold hover:bg-white/[0.02] flex items-center justify-center gap-2 transition-all border-t border-white/5">
            <Plus className="w-4 h-4" /> Add Another Country
          </button>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex justify-between items-center bg-white/5">
           <div className="text-slate-500 text-sm">
             Total: <span className="text-white font-bold">{rows.length}</span> matters to create
           </div>
           <div className="flex gap-3">
             <button onClick={onClose} className="px-6 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 transition-all text-sm font-medium">Cancel</button>
             <button onClick={handleSave} disabled={!common.clientId || !common.projectId}
                className="px-8 py-2.5 rounded-xl bg-legal-gold text-slate-900 font-bold hover:scale-105 transition-all shadow-lg shadow-legal-gold/20 disabled:opacity-50 disabled:scale-100 flex items-center gap-2">
               <Save className="w-4 h-4" /> Save All Matters
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
