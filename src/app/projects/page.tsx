"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { fetchAuth } from "@/lib/fetchAuth";
import { getAuth } from "@/lib/auth";
import useSWR from "swr";

interface Client { id: number; name: string; }
interface Bank { id: number; name: string; currency: string; }
interface AdvPayment { id: number; amount: number; currency: string; accountType: "TRUST" | "EXPENSE"; notes?: string | null; bankId?: number | null; }
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
  const [filterClient, setFilterClient] = useState("");

  // inline edit (name + status only)
  const [editingId, setEditingId]   = useState<number | null>(null);
  const [tempName, setTempName]     = useState("");
  const [tempStatus, setTempStatus] = useState("OPEN");

  // advance modal
  const [advModal, setAdvModal]   = useState<number | null>(null); // projectId
  const [advPayments, setAdvPayments] = useState<AdvPayment[]>([]);
  const [advLoading, setAdvLoading]   = useState(false);

  // trust form
  const [trustId, setTrustId]         = useState<number | null>(null);
  const [trustAmt, setTrustAmt]       = useState("");
  const [trustCur, setTrustCur]       = useState("USD");
  const [trustNotes, setTrustNotes]   = useState("");
  const [trustBankId, setTrustBankId] = useState<number | "">("");

  // expense form
  const [expId, setExpId]             = useState<number | null>(null);
  const [expAmt, setExpAmt]           = useState("");
  const [expCur, setExpCur]           = useState("USD");
  const [expNotes, setExpNotes]       = useState("");
  const [expBankId, setExpBankId]     = useState<number | "">("");

  // files modal
  const [filesModal, setFilesModal]   = useState<number | null>(null);
  const [projectDocs, setProjectDocs] = useState<any[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const token  = getAuth();

  // fetch banks for dropdown
  const { data: banks = [] } = useSWR<Bank[]>("/api/banks", (url: string) =>
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json())
  );

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
      setTrustBankId(trust?.bankId ?? "");
      setExpId(expense?.id ?? null);
      setExpAmt(expense ? String(expense.amount) : "");
      setExpCur(expense?.currency ?? "USD");
      setExpNotes(expense?.notes ?? "");
      setExpBankId(expense?.bankId ?? "");
    } catch { toast.error("Failed to load advances"); }
    finally  { setAdvLoading(false); }
  };

  /* ─── save advance payment (create or update) ─── */
  const saveAdvance = async (accountType: "TRUST" | "EXPENSE") => {
    const isTrust  = accountType === "TRUST";
    const id       = isTrust ? trustId    : expId;
    const amount   = isTrust ? trustAmt   : expAmt;
    const currency = isTrust ? trustCur   : expCur;
    const notes    = isTrust ? trustNotes : expNotes;
    const bankId   = isTrust ? trustBankId: expBankId;

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
          body: JSON.stringify({ amount: parseFloat(amount), currency, notes: notes || null, bankId: bankId || null }),
        });
        if (!res.ok) throw new Error(await res.text());
      } else {
        // create new
        const res = await fetch("/api/advance-payments", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ projectId: advModal, amount: parseFloat(amount), currency, accountType, notes: notes || null, bankId: bankId || null }),
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

  // ── Files Modal ────────────────────────────────────────────
  const openFiles = async (projectId: number) => {
    setFilesModal(projectId);
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/upload/document?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjectDocs(res.ok ? await res.json() : []);
    } catch { setProjectDocs([]); }
    finally { setDocsLoading(false); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!filesModal || !e.target.files?.length) return;
    const files = Array.from(e.target.files);
    setUploadingFiles(true);
    for (const file of files) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('projectId', String(filesModal));
      try {
        const res = await fetch('/api/upload/document', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!res.ok) { toast.error(`Failed: ${file.name}`); }
      } catch { toast.error(`Error uploading ${file.name}`); }
    }
    setUploadingFiles(false);
    e.target.value = '';
    // refresh list
    const res = await fetch(`/api/upload/document?projectId=${filesModal}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setProjectDocs(res.ok ? await res.json() : []);
    toast.success(`${files.length} file(s) uploaded`);
  };

  const deleteDoc = async (docId: number) => {
    if (!confirm('Remove this file?')) return;
    const res = await fetch(`/api/upload/document?id=${docId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      setProjectDocs(prev => prev.filter((d: any) => d.id !== docId));
      toast.success('File removed');
    } else { toast.error('Delete failed'); }
  };

  const fileIcon = (mime: string) => {
    if (mime === 'application/pdf') return '📄';
    if (mime?.includes('word')) return '📝';
    if (mime?.includes('excel') || mime?.includes('spreadsheet')) return '📊';
    return '📎';
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/projects/import', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Imported ${data.count} projects successfully.`);
      if (data.errors > 0) {
        toast.error(`${data.errors} rows failed. Error: ${data.firstError || 'Check console'}`);
      }
      fetchProjects();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const exportToCSV = () => {
    if (projects.length === 0) {
      toast.error("No projects to export");
      return;
    }

    const headers = ["Client", "Code", "Project Name", "Status", "Advance Payment"];
    const rows = projects.map(p => [
      p.client.name,
      p.code,
      p.name,
      p.status,
      formatAdv(p).replace(/,/g, ';') // avoid CSV comma issues
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `projects_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const visible = projects.filter(p =>
    (!filterCode || p.code.toLowerCase().includes(filterCode.toLowerCase())) &&
    (!filterName || p.name.toLowerCase().includes(filterName.toLowerCase())) &&
    (!filterClient || p.client.name.toLowerCase().includes(filterClient.toLowerCase()))
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
          <div className="flex gap-2">
            <a
              href={`/templates/projects_import_template.csv?v=${Date.now()}`}
              download
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded text-xs inline-flex items-center"
            >
              Template
            </a>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-xs"
            >
              {isImporting ? 'Importing...' : 'Import CSV'}
            </button>

            <button
              onClick={exportToCSV}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-4 rounded text-xs"
            >
              Export CSV
            </button>

            <button onClick={() => router.push("/projects/new")} className="btn-legal">
              New Project
            </button>
          </div>
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
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-1">Filter by Client</label>
              <input value={filterClient} onChange={e => setFilterClient(e.target.value)}
                className="rounded px-3 py-2 text-sm w-52" placeholder="Client name" />
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
                  <div className="grid grid-cols-2 gap-3">
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
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Bank Account</label>
                      <select value={trustBankId} onChange={e => setTrustBankId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none">
                        <option value="">No bank (manual)</option>
                        {Array.isArray(banks) && banks
                          .filter((b: Bank) => !trustCur || b.currency === trustCur)
                          .map((b: Bank) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
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
                  <div className="grid grid-cols-2 gap-3">
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
                      <label className="block text-[10px] uppercase tracking-widest text-slate-400 mb-1">Bank Account</label>
                      <select value={expBankId} onChange={e => setExpBankId(e.target.value ? Number(e.target.value) : "")}
                        className="w-full rounded px-3 py-2 text-sm focus:outline-none">
                        <option value="">No bank (manual)</option>
                        {Array.isArray(banks) && banks
                          .filter((b: Bank) => !expCur || b.currency === expCur)
                          .map((b: Bank) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
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
      {/* ═══════════ Files Modal ═══════════ */}
      {filesModal !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="legal-card w-full max-w-lg p-8 relative max-h-[85vh] overflow-y-auto">
            <button onClick={() => { setFilesModal(null); setProjectDocs([]); }}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg leading-none">✕</button>

            <h2 className="text-2xl font-serif text-white mb-1">Project Files</h2>
            <p className="text-slate-400 text-xs mb-6 uppercase tracking-widest">Project #{filesModal}</p>

            {/* Upload zone */}
            <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 mb-5 cursor-pointer transition-colors ${
              uploadingFiles ? 'border-amber-500/40 opacity-60' : 'border-white/10 hover:border-sky-500/30'
            }`}>
              <span className="text-2xl">{uploadingFiles ? '⏳' : '📎'}</span>
              <span className="text-sm text-slate-400">
                {uploadingFiles ? 'Uploading…' : 'Click to upload files (PDF · Word · Excel)'}
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                disabled={uploadingFiles}
                onChange={handleFileUpload}
              />
            </label>

            {/* File list */}
            {docsLoading ? (
              <p className="text-slate-400 text-center py-4">Loading files…</p>
            ) : projectDocs.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4 italic">No files attached yet.</p>
            ) : (
              <ul className="space-y-2">
                {projectDocs.map((doc: any) => (
                  <li key={doc.id} className="flex items-center justify-between rounded-lg px-4 py-3 bg-white/5 border border-white/5">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-lg flex-shrink-0">{fileIcon(doc.mimeType)}</span>
                      <div className="min-w-0">
                        <a href={doc.storageKey} target="_blank" rel="noopener noreferrer"
                          className="text-sm text-sky-400 hover:text-sky-300 transition-colors truncate block max-w-[260px]">
                          {doc.filename}
                        </a>
                        <span className="text-[10px] text-slate-600">
                          {(doc.sizeBytes / 1024).toFixed(0)} KB &nbsp;·&nbsp;
                          {new Date(doc.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => deleteDoc(doc.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors text-xs flex-shrink-0 ml-2">🗑</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}