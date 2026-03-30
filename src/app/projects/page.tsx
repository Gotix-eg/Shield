"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { fetchAuth } from "@/lib/fetchAuth";
import { getAuth } from "@/lib/auth";

interface Client { id: number; name: string; }
interface AdvPayment { id: number; amount: number; currency: string; accountType: "TRUST" | "EXPENSE"; notes?: string | null; }
interface Project {
  id: number;
  code: string;
  name: string;
  status: string;
  advanceAmount: number | null;
  advanceCurrency: string | null;
  advanceTotals?: { currency: string; total: number }[];
  client: Client;
}

const CURRENCIES = ["USD","EUR","GBP","SAR","EGP","AED","QAR","KWD","OMR","JPY","CNY","INR"];

export default function ProjectsPage() {
  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");

  // inline edit (name + status only)
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [tempName, setTempName]     = useState("");
  const [tempStatus, setTempStatus] = useState("OPEN");

  // advance modal
  const [advModal, setAdvModal]   = useState<number | null>(null); // projectId
  const [advPayments, setAdvPayments] = useState<AdvPayment[]>([]);
  const [advLoading, setAdvLoading]   = useState(false);

  // trust form
  const [trustId, setTrustId]       = useState<number | null>(null);
  const [trustAmt, setTrustAmt]     = useState("");
  const [trustCur, setTrustCur]     = useState("USD");
  const [trustNotes, setTrustNotes] = useState("");

  // expense form
  const [expId, setExpId]           = useState<number | null>(null);
  const [expAmt, setExpAmt]         = useState("");
  const [expCur, setExpCur]         = useState("USD");
  const [expNotes, setExpNotes]     = useState("");

  const router = useRouter();
  const token  = getAuth();

  /* ─── fetch projects ─── */
  const fetchProjects = async () => {
    try {
      const res = await fetchAuth("/api/projects");
      if (!res.ok) throw new Error();
      setProjects(await res.json());
    } catch { setError("Failed to load projects"); }
    finally  { setLoading(false); }
  };
  useEffect(() => { fetchProjects(); }, []);

  /* ─── fetch advance payments for modal ─── */
  const openAdv = async (projectId: number) => {
    setAdvModal(projectId);
    setAdvLoading(true);
    try {
      const res = await fetch(`/api/advance-payments?projectId=${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data: AdvPayment[] = res.ok ? await res.json() : [];
      setAdvPayments(data);
      // pre-fill forms
      const trust   = data.find(p => p.accountType === "TRUST");
      const expense = data.find(p => p.accountType === "EXPENSE");
      setTrustId(trust?.id ?? null);
      setTrustAmt(trust ? String(trust.amount) : "");
      setTrustCur(trust?.currency ?? "USD");
      setTrustNotes(trust?.notes ?? "");
      setExpId(expense?.id ?? null);
      setExpAmt(expense ? String(expense.amount) : "");
      setExpCur(expense?.currency ?? "USD");
      setExpNotes(expense?.notes ?? "");
    } catch { toast.error("Failed to load advances"); }
    finally  { setAdvLoading(false); }
  };

  /* ─── save advance payment (create or update) ─── */
  const saveAdvance = async (accountType: "TRUST" | "EXPENSE") => {
    const isTrust  = accountType === "TRUST";
    const id       = isTrust ? trustId   : expId;
    const amount   = isTrust ? trustAmt  : expAmt;
    const currency = isTrust ? trustCur  : expCur;
    const notes    = isTrust ? trustNotes: expNotes;

    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    try {
      if (id) {
        // update existing
        const res = await fetch(`/api/advance-payments/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ amount: parseFloat(amount), currency, notes: notes || null }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        // create new
        const res = await fetch("/api/advance-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ projectId: advModal, amount: parseFloat(amount), currency, accountType, notes: notes || null }),
        });
        if (!res.ok) throw new Error(await res.text());
        const created: AdvPayment = await res.json();
        if (isTrust) setTrustId(created.id);
        else         setExpId(created.id);
      }
      toast.success(`${isTrust ? "Trust" : "Expense"} advance saved`);
      fetchProjects();
    } catch (e: any) {
      console.error(e);
      toast.error("Save failed: " + (e?.message ?? "Unknown error"));
    }
  };

  /* ─── inline edit (name + status) ─── */
  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setTempName(p.name);
    setTempStatus(p.status);
  };
  const cancelEdit = () => { setEditingId(null); };
  const saveEdit = async (id: number) => {
    if (!tempName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: tempName.trim(), status: tempStatus }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Project updated");
      setProjects(prev => prev.map(p => p.id === id ? { ...p, name: tempName.trim(), status: tempStatus } : p));
    } catch (e: any) {
      toast.error("Update failed");
    } finally { cancelEdit(); }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetchAuth(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      fetchProjects();
    } catch { toast.error("Deletion failed"); }
  };

  const visible = projects.filter(p =>
    (!filterCode || p.code.toLowerCase().includes(filterCode.toLowerCase())) &&
    (!filterName || p.name.toLowerCase().includes(filterName.toLowerCase()))
  );

  const formatAdv = (p: Project) => {
    if (p.advanceTotals?.length) return p.advanceTotals.map(t => `${t.total} ${t.currency}`).join(", ");
    if (p.advanceAmount !== null) return `${p.advanceAmount} ${p.advanceCurrency ?? ""}`;
    return "—";
  };

  return (
    <div className="dashboard-container">
      <Toaster />
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif text-white tracking-tight mb-1">Projects</h1>
            <p className="text-slate-400 font-light text-sm">Manage your projects</p>
          </div>
          <button onClick={() => router.push("/projects/new")} className="btn-legal">
            New Project
          </button>
        </div>

        {loading && <p className="text-slate-400">Loading…</p>}
        {error   && <p className="text-red-400">{error}</p>}

        {/* Filters */}
        {!loading && !error && (
          <div className="mb-5 flex flex-wrap gap-4">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Filter by Code</label>
              <input value={filterCode} onChange={e => setFilterCode(e.target.value)}
                className="rounded px-3 py-2 text-sm w-40" placeholder="e.g. P0001" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Filter by Name</label>
              <input value={filterName} onChange={e => setFilterName(e.target.value)}
                className="rounded px-3 py-2 text-sm w-52" placeholder="Project name" />
            </div>
          </div>
        )}

        {/* Table */}
        {!loading && !error && (
          <div className="legal-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5">
                  {["Client","Code","Project Name","Status","Advance Payment"].map(h => (
                    <th key={h} className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody>
                {visible.map(p => (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{p.client.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400 whitespace-nowrap">{p.code}</td>

                    {/* name */}
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <input value={tempName} onChange={e => setTempName(e.target.value)}
                          className="rounded px-2 py-1 text-sm w-full" />
                      ) : (
                        <Link href={`/projects/${p.id}`} className="text-legal-gold hover:text-yellow-300 transition-colors font-medium">
                          {p.name}
                        </Link>
                      )}
                    </td>

                    {/* status */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === p.id ? (
                        <select value={tempStatus} onChange={e => setTempStatus(e.target.value)}
                          className="rounded px-2 py-1 text-xs">
                          {["OPEN","CLOSED"].map(s => <option key={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                          p.status === "OPEN"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}>{p.status}</span>
                      )}
                    </td>

                    {/* advance */}
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap text-xs">{formatAdv(p)}</td>

                    {/* actions */}
                    <td className="px-6 py-4 text-right whitespace-nowrap">
                      {editingId === p.id ? (
                        <span className="flex gap-2 justify-end">
                          <button onClick={() => saveEdit(p.id)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all">
                            Save
                          </button>
                          <button onClick={cancelEdit}
                            className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-slate-400 border border-white/10 hover:border-white/20 transition-all">
                            Cancel
                          </button>
                        </span>
                      ) : (
                        <span className="flex gap-2 justify-end">
                          <button onClick={() => startEdit(p)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-legal-gold border border-legal-gold/20 hover:bg-legal-gold/10 transition-all">
                            Edit
                          </button>
                          <button onClick={() => openAdv(p.id)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider text-slate-300 border border-white/10 hover:border-white/20 transition-all">
                            Advances
                          </button>
                          <button onClick={() => deleteProject(p.id)}
                            className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all">
                            Delete
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr><td colSpan={6} className="text-center py-10 text-slate-500 italic">No projects found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-sm">
          <Link href="/dashboard" className="text-legal-gold hover:text-yellow-300 transition-colors">← Back to Dashboard</Link>
        </p>
      </div>

      {/* ═══════════ Advance Payments Modal ═══════════ */}
      {advModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="legal-card w-full max-w-xl p-8 relative">
            <button onClick={() => setAdvModal(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg leading-none">✕</button>

            <h2 className="text-2xl font-serif text-white mb-1">Advance Payments</h2>
            <p className="text-slate-400 text-xs mb-6 uppercase tracking-widest">Project #{advModal}</p>

            {advLoading ? (
              <p className="text-slate-400 text-center py-8">Loading…</p>
            ) : (
              <div className="space-y-6">
                {/* ── Trust / القضية ── */}
                <div className="rounded-lg border border-emerald-500/20 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
                    <p className="text-sm font-bold text-emerald-400 uppercase tracking-widest">Case Advance (Trust)</p>
                    {trustId && <span className="ml-auto text-[10px] text-slate-500 uppercase">Editing existing</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Amount</label>
                      <input type="number" step="0.01" value={trustAmt} onChange={e => setTrustAmt(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:ring-1 focus:ring-emerald-400/50 focus:outline-none" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Currency</label>
                      <select value={trustCur} onChange={e => setTrustCur(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Notes</label>
                      <input type="text" value={trustNotes} onChange={e => setTrustNotes(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none" placeholder="Optional" />
                    </div>
                  </div>
                  <button onClick={() => saveAdvance("TRUST")}
                    className="w-full py-2 rounded text-[11px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/25 transition-all">
                    {trustId ? "Update Trust Advance" : "Add Trust Advance"}
                  </button>
                </div>

                {/* ── Expense / المصاريف ── */}
                <div className="rounded-lg border border-amber-500/20 p-5 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                    <p className="text-sm font-bold text-amber-400 uppercase tracking-widest">Expense Advance</p>
                    {expId && <span className="ml-auto text-[10px] text-slate-500 uppercase">Editing existing</span>}
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Amount</label>
                      <input type="number" step="0.01" value={expAmt} onChange={e => setExpAmt(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:ring-1 focus:ring-amber-400/50 focus:outline-none" placeholder="0.00" />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Currency</label>
                      <select value={expCur} onChange={e => setExpCur(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none">
                        {CURRENCIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Notes</label>
                      <input type="text" value={expNotes} onChange={e => setExpNotes(e.target.value)}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none" placeholder="Optional" />
                    </div>
                  </div>
                  <button onClick={() => saveAdvance("EXPENSE")}
                    className="w-full py-2 rounded text-[11px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/25 transition-all">
                    {expId ? "Update Expense Advance" : "Add Expense Advance"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}