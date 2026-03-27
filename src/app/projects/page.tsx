"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { fetchAuth } from "@/lib/fetchAuth";
import { getAuth } from "@/lib/auth";

interface Client {
  id: number;
  name: string;
}

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

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempStatus, setTempStatus] = useState("OPEN");
  const [tempAmount, setTempAmount] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  /* ---------- helpers ---------- */
  const fetchProjects = async () => {
    try {
      const res = await fetchAuth("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch");
      setProjects(await res.json());
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setTempName(p.name);
    setTempStatus(p.status);
    setTempAmount(p.advanceAmount !== null ? String(p.advanceAmount) : "");
    setTempCurrency(p.advanceCurrency ?? "USD");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempName("");
  };

  const saveEdit = async (id: number) => {
    if (!tempName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuth()}`,
        },
        body: JSON.stringify({
          name: tempName.trim(),
          status: tempStatus,
          advanceAmount: tempAmount ? parseFloat(tempAmount) : null,
          advanceCurrency: tempCurrency,
        }),
      });
      if (!res.ok) throw new Error("Failed update");
      toast.success("Project updated");
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
              ...p,
              name: tempName.trim(),
              status: tempStatus,
              advanceAmount: tempAmount ? parseFloat(tempAmount) : null,
              advanceCurrency: tempCurrency,
            }
            : p
        )
      );
    } catch {
      toast.error("Update failed");
    } finally {
      cancelEdit();
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetchAuth(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      fetchProjects();
    } catch {
      toast.error("Deletion failed");
    }
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
          Authorization: `Bearer ${getAuth()}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Imported ${data.count} projects successfully.`);
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} rows failed to import. Check console.`);
        console.error("Import errors:", data.errors);
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
  /* -------------------------------- */

  useEffect(() => {
    fetchProjects();
  }, []);

  const visibleProjects = projects.filter((p) => {
    const codeMatch = filterCode
      ? p.code.toLowerCase().includes(filterCode.toLowerCase())
      : true;
    const nameMatch = filterName
      ? p.name.toLowerCase().includes(filterName.toLowerCase())
      : true;
    return codeMatch && nameMatch;
  });

  return (
    <div className="px-8 py-12 min-h-screen">
      <Toaster />
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div>
          <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">المشاريع</h1>
          <p className="text-slate-400 font-light max-w-xl">تتبع وإدارة القضايا والملفات القانونية بكل دقة واحترافية.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <a
            href={`/templates/projects_import_template.csv?v=${Date.now()}`}
            download
            className="btn-legal-outline flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            نموذج الاستيراد
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
            className="btn-legal-outline flex items-center gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            {isImporting ? 'جاري الاستيراد...' : 'استيراد CSV'}
          </button>

          <button
            onClick={() => router.push("/projects/new")}
            className="btn-legal"
          >
            <span className="text-xl">+</span> إضافة مشروع جديد
          </button>
        </div>
      </header>

      {/* filters + states */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-legal-gold" />
        </div>
      )}
      {error && (
        <div className="legal-card p-6 border-red-500/20 bg-red-500/5 mb-8">
          <h3 className="font-serif text-red-400 text-lg mb-1">خطأ</h3>
          <p className="text-red-300/70">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="mb-8 flex flex-wrap gap-6 items-end justify-end">
          <div className="w-full md:w-auto">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 mr-1">البحث بالاسم</label>
            <input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-full md:min-w-[250px] text-right"
              placeholder="اسم المشروع..."
            />
          </div>
          <div className="w-full md:w-auto">
            <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2 mr-1">البحث بالكود</label>
            <input
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-full md:min-w-[150px] font-mono text-right"
              placeholder="P0000..."
            />
          </div>
        </div>
      )}

      {/* table */}
      {!loading && !error && (
        <div className="legal-card overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">العميل</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">الكود</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">اسم المشروع</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">الحالة</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">الدفعة المقدمة</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {visibleProjects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-slate-500 font-light italic">
                      لا توجد مشاريع تطابق البحث.
                    </td>
                  </tr>
                ) : (
                  visibleProjects.map((p) => (
                    <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 text-slate-300">{p.client.name}</td>
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{p.code}</td>
                      <td className="px-8 py-6">
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-slate-200 font-medium group-hover:text-legal-gold transition-colors"
                        >
                          {p.name}
                        </Link>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-wider ${p.status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : p.status === 'CLOSED' ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-slate-400 text-sm font-light">
                        {p.advanceTotals && p.advanceTotals.length ? p.advanceTotals.map((t) => `${t.total} ${t.currency}`).join(", ") : p.advanceAmount !== null ? `${p.advanceAmount} ${p.advanceCurrency ?? ""}` : "—"}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => router.push(`/projects/${p.id}`)}
                            className="text-slate-400 hover:text-legal-gold transition-colors p-1"
                            title="عرض"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          </button>
                          <button
                            onClick={() => deleteProject(p.id)}
                            className="text-slate-400 hover:text-red-400 transition-colors p-1"
                            title="حذف"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-12 text-sm">
        <Link href="/dashboard" className="text-slate-500 hover:text-legal-gold transition-colors flex items-center gap-2">
          <span>←</span> العودة للوحة التحكم
        </Link>
      </p>
    </div>
  );
}