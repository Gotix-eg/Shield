"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import { useTranslation } from "react-i18next";

interface LawyerRow {
  userId: number;
  userName: string;
  totalHours: number;
  billableHours: number;
  utilisationPct: number;
  cost: number;
  currency: string;
  rating: string;
  targetHours: number;
}

export default function LawyersReportPage() {
  const { t } = useTranslation("reports");
  const [data, setData] = useState<LawyerRow[]>([]);
  const [projects, setProjects] = useState<{id:number,name:string}[]>([]);
  const [lawyers, setLawyers] = useState<{id:number,name:string}[]>([]);
  const [lawyerId, setLawyerId] = useState<string>("");
  const [projectId, setProjectId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [start, setStart] = useState<string>("");
  const [end, setEnd] = useState<string>("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if(projectId) params.set("projectId", projectId);
    if(lawyerId) params.set("userId", lawyerId);
    if (start) params.set("start", start);
    if (end) params.set("end", end);

    const token = getAuth();
    const headers: Record<string,string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`/api/reports/lawyers?${params.toString()}`, { headers });
    const json = await res.json();
    setData(json.results ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // fetch projects list
    fetch('/api/projects').then(r=>r.json()).then((arr)=>{
      setProjects(arr);
          });
    // fetch lawyers list
    const token = getAuth();
    fetch('/api/employees', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then(r=>r.ok?r.json():[]).then((arr:any[])=> setLawyers(arr));
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Lawyers Performance</h1>
            <p className="text-slate-400 font-light max-w-xl">Analytical report on lawyer utilization, billable hours, and performance ratings.</p>
          </div>
          <Link href="/admin/reports" className="btn-legal-outline">Back to Reports</Link>
        </div>
      </header>

      {/* Filters */}
      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Performance Filters</h3>
        <div className="flex gap-6 mb-4 items-end flex-wrap">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Project</label>
            <select 
              value={projectId} 
              onChange={e=>setProjectId(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              <option value="" className="bg-slate-900">All Projects</option>
              {projects.map(p=> <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Lawyer</label>
            <select 
              value={lawyerId} 
              onChange={e=>setLawyerId(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              <option value="" className="bg-slate-900">All Lawyers</option>
              {lawyers.map(l=> <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Start Date</label>
            <input 
              type="date" 
              value={start} 
              onChange={(e)=>setStart(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">End Date</label>
            <input 
              type="date" 
              value={end} 
              onChange={(e)=>setEnd(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <button onClick={load} disabled={loading} className="btn-legal px-8 h-[42px]">
            {loading ? "Loading..." : "Apply Filters"}
          </button>
        </div>
      </div>

      <div className="legal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Lawyer</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Total Hours</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Billable</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Utilisation</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Cost</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.length === 0 && !loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-16 text-center text-slate-500 italic font-light">No performance data found for the selected criteria.</td>
                </tr>
              ) : (
                data.map((r) => (
                  <tr key={r.userId} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-200 font-medium">{r.userName}</td>
                    <td className="px-8 py-6 text-right text-slate-400 font-mono text-xs">{r.totalHours.toFixed(2)}</td>
                    <td className="px-8 py-6 text-right text-slate-300 font-bold">{r.billableHours.toFixed(2)}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-legal-gold font-bold">{r.utilisationPct.toFixed(1)}%</span>
                        <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-legal-gold" style={{ width: `${Math.min(r.utilisationPct, 100)}%` }}></div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right text-slate-400 font-mono text-xs">{r.cost.toLocaleString(undefined, { minimumFractionDigits: 2 })} {r.currency}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        r.rating === 'EXCELLENT' ? 'bg-emerald-500/10 text-emerald-400' :
                        r.rating === 'GOOD' ? 'bg-legal-gold/10 text-legal-gold' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {r.rating}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
