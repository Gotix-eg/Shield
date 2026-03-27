"use client";

import React, { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import { useTranslation, initReactI18next } from "react-i18next";
import i18n from "i18next";

// ensure i18n initialised once (client side)
if (typeof window !== 'undefined' && !i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    lng: 'en',
    resources: {},
  });
}

interface Expense {
  id: number;
  projectId: number;
  amount: number;
  currency: string;
  description: string;
  incurredOn: string;
  project?: { name: string; client?: { name: string } };
  receiptUrl?: string;
}

export default function ExpensesPage() {
  const { t } = useTranslation("expenses");
  const token = getAuth();
  // helper to decode userId from JWT
  const getUserIdFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Number(payload.sub);
    } catch {
      return null;
    }
  };
  const currentUserId = getUserIdFromToken();
  // decode role to know if admin
  const getRoleFromToken = () => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.role ?? null;
    } catch {
      return null;
    }
  };
  const role = getRoleFromToken();
  const isAdmin = ["OWNER","ADMIN","MANAGING_PARTNER","HR_MANAGER","LAWYER_MANAGER"].includes(String(role));
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [lawyers, setLawyers] = useState<{id:number;name:string}[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number|"">("");

  // form state
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [loading, setLoading] = useState(false);
  const [receiptFile,setReceiptFile]=useState<File|null>(null);
  const [editingId,setEditingId]=useState<number|null>(null);
  const [editAmount,setEditAmount]=useState("");
  const [editDescription,setEditDescription]=useState("");

  const headers = token ? { Authorization: `Bearer ${token}` } : undefined;

  const loadLists = async () => {
    const [cRes, pRes, aRes, lRes] = await Promise.all([
      fetch("/api/clients", { headers }),
      fetch("/api/projects", { headers }),
      fetch("/api/assignments", { headers }),
      isAdmin ? fetch("/api/lawyers", { headers }) : Promise.resolve(new Response(JSON.stringify([]), { headers: { 'Content-Type':'application/json' } })),
    ]);

    const allClients = cRes.ok ? await cRes.json() : [];
    if (aRes.ok) {
      const asn = await aRes.json();
      setAssignments(asn);
      // build unique projects list from assignments
      const uniqProjects = Array.from(new Map(asn.map((a:any)=>{
        const proj = { ...a.project, clientId: a.project.client?.id };
        return [proj.id, proj];
      })).values());
      setProjects(uniqProjects);

      // for non-admin users, restrict clients to those they have assignments for
      if (!isAdmin) {
        const clientMap = new Map<number, any>();
        asn.forEach((a:any)=>{
          const c = a.project?.client;
          if (c && !clientMap.has(c.id)) clientMap.set(c.id, c);
        });
        setClients(Array.from(clientMap.values()));
      } else {
        setClients(allClients);
      }
    } else {
      // fallback: no assignments API, use full projects/clients
      if (pRes.ok) setProjects(await pRes.json());
      setClients(allClients);
    }

    if (isAdmin && lRes.ok) {
      const ls = await lRes.json();
      setLawyers(Array.isArray(ls) ? ls : []);
    }
  };

  const loadExpenses = async () => {
    const res = await fetch("/api/expenses", { headers });
    if (res.ok) setExpenses(await res.json());
  };

  useEffect(() => {
    loadLists();
    loadExpenses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resetForm = () => {
    setClientId("");
    setProjectId("");
    setType("");
    setDescription("");
    setAmount("");
    setReceiptFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !amount) return;
    setLoading(true);
      let receiptUrl: string | undefined;
      if(receiptFile){
        const fd = new FormData();
        fd.append('file', receiptFile);
        const upRes = await fetch('/api/upload/receipt', { method: 'POST', body: fd, headers });
        if(upRes.ok){
          const j = await upRes.json();
          receiptUrl = j.url;
        }
      }
    try {
      const isAdminMode = isAdmin && selectedUserId !== "";
      const url = isAdminMode ? "/api/admin/expenses" : "/api/expenses";
      const payload:any = { projectId: Number(projectId), amount: Number(amount), currency, type: type || 'OTHER', description, receiptUrl };
      if (isAdminMode) payload.userId = Number(selectedUserId);
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        resetForm();
        loadExpenses();
      } else {
        const err = await res.json().catch(()=>({error:'Error'}));
        alert(err.error || 'Save failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Expenses</h1>
        <p className="text-slate-400 font-light max-w-xl">Track and manage professional disbursements and billable expenses.</p>
      </header>

      {/* form */}
      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">New Expense</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {isAdmin && (
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Lawyer</label>
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                value={selectedUserId}
                onChange={(e)=>setSelectedUserId(e.target.value? Number(e.target.value):"")}
                required
              >
                <option value="">Select Lawyer</option>
                {lawyers.map(l=> (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Client</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
              value={clientId}
              onChange={(e) => {
                setClientId(e.target.value);
                setProjectId("");
              }}
            >
              <option value="">Select Client</option>
              {clients.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Project</label>
            <select
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              disabled={!clientId}
            >
              <option value="">Select Project</option>
              {projects
                .filter((p: any) => {
                  const projClientId = (p.clientId ?? (p.client?.id)) as number | undefined;
                  const clientOk = !clientId || projClientId === Number(clientId);
                  const targetUser = isAdmin && selectedUserId !== "" ? Number(selectedUserId) : currentUserId;
                  const assignedOk = assignments.some((a:any)=>a.projectId===p.id && (!targetUser || a.userId===targetUser));
                  return clientOk && assignedOk;
                })
                .map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Receipt / Document</label>
            <input type="file" onChange={e=>setReceiptFile(e.target.files?.[0]||null)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-1.5 text-xs text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-legal-gold/10 file:text-legal-gold hover:file:bg-legal-gold/20" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Expense Type</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
              placeholder="e.g. Travel, Court Fees"
              value={type}
              onChange={(e) => setType(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Amount & Currency</label>
            <div className="flex gap-2">
              <input
                type="number"
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <select
                className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-2.5 text-xs text-white focus:border-legal-gold/50 transition-colors"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {['USD','EUR','EGP','SAR','AED','QAR','KWD','OMR','GBP'].map(c=> (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>
          
          <div className="md:col-span-3 space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Description</label>
            <textarea
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors min-h-[100px]"
              placeholder="Detailed explanation of the expense..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="md:col-span-3 pt-4">
            <button
              type="submit"
              className="btn-legal px-12 min-w-[160px]"
              disabled={loading}
            >
              {loading ? "Processing..." : "Submit Expense"}
            </button>
          </div>
        </form>
      </div>

      <div className="legal-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Project</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Description</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Amount</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-16 text-center text-slate-500 font-light italic">
                  No expense records found.
                </td>
              </tr>
            ) : (
              expenses.map((exp) => (
                <tr key={exp.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(exp.incurredOn).toLocaleDateString()}</td>
                  <td className="px-8 py-6 text-slate-200">{exp.project?.name}</td>
                  <td className="px-8 py-6 text-slate-400 text-sm font-light">{exp.description}</td>
                  <td className="px-8 py-6 font-bold text-legal-gold">{exp.amount.toLocaleString()} {exp.currency}</td>
                  <td className="px-8 py-6 text-center">
                    {exp.receiptUrl ? (
                      <a href={exp.receiptUrl} target="_blank" className="btn-legal-outline px-4 py-1.5 text-[10px] border-legal-gold/30 text-legal-gold hover:bg-legal-gold/10">View</a>
                    ) : (
                      <span className="text-slate-600 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
