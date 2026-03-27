"use client";

import { useEffect, useState, FormEvent } from "react";
import { getAuth } from "@/lib/auth";
import Link from "next/link";
import { Clock, BarChart3 } from "lucide-react";

interface ClientOption {
  id: number;
  name: string;
}

type UserRole = "OWNER" | "STAFF" | string;

function decodeRole(token?: string): UserRole | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return (payload.role ?? "STAFF") as any;
  } catch {
    return null;
  }
}

interface ProjectOption {
  id: number;
  name: string;
  clientId: number;
}
interface LawyerOption { id:number; name:string }

interface TimeEntry {
  id: number;
  projectId: number;
  startTs: string;
  endTs: string | null;
  durationMins: number;
  notes?: string;
  project: { id: number; name: string };
}

export default function TimeEntriesPage() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [lawyers, setLawyers] = useState<LawyerOption[]>([]);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [now, setNow] = useState(Date.now()); // update each second for live timer
  const [tick, setTick] = useState(0); // minute tick for summaries
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleError = async (res: Response) => {
    const data = await safeJson(res);
    const message = (data as any)?.error || res.statusText;
    throw new Error(message);
  };

  // form state
  const [clientId, setClientId] = useState<number | "">("");
  const [projectId, setProjectId] = useState<number | "">("");
  const [startTs, setStartTs] = useState("");
  const [endTs, setEndTs] = useState("");
  const [notes, setNotes] = useState("");
  // quick entry: date + hours
  const [quickDate, setQuickDate] = useState("");
  const [quickHours, setQuickHours] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const token = getAuth();
  const role = decodeRole(token || undefined);
  const isAdmin = ["OWNER","ADMIN","MANAGING_PARTNER","HR_MANAGER","LAWYER_MANAGER"].includes(String(role));
  const [selectedUserId, setSelectedUserId] = useState<number | "">("");

  const fetchInitial = async () => {
    if (!token) return;
    try {
      const [clientRes, projRes, entryRes, lawyersRes] = await Promise.all([
        fetch("/api/clients", { headers: { Authorization: `Bearer ${token}` } }),
        fetch(!(role === "OWNER" || role === "ADMIN") ? "/api/my-projects" : "/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/time-entries", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        isAdmin ? fetch('/api/lawyers', { headers: { Authorization: `Bearer ${token}` } }) : Promise.resolve(new Response(JSON.stringify([]), { headers: { 'Content-Type':'application/json' } })),
      ]);
      const clientsData = await clientRes.json();
      const projData = await projRes.json();
      const projArr = Array.isArray(projData) ? projData : [];
      setProjects(projArr);
      if (isAdmin) {
        const lawyersData = await lawyersRes.json();
        setLawyers(Array.isArray(lawyersData) ? lawyersData : []);
      }
      if (role === "OWNER" || role === "ADMIN") {
        setClients(Array.isArray(clientsData) ? clientsData : []);
      } else {
        const allowedClients = [...new Map(
          projArr
            .filter((p:any)=>p.client)
            .map((p:any)=>[p.client.id, p.client])
        ).values()];
        setClients(allowedClients);
      }
      const entriesData = await entryRes.json();
      setEntries(Array.isArray(entriesData) ? entriesData : []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitial();
    const minInterval = setInterval(() => setTick((t) => t + 1), 60000);
    const secInterval = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(minInterval);
      clearInterval(secInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeJson = async (res: Response) => {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) return res.json();
    return null;
  };

  const startTimer = async () => {
    if (!token || clientId === "" || projectId === "") return;
    if (role === "STAFF" && entries.some((e) => !e.endTs)) {
      alert("You already have an active timer. Stop it before starting a new one.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/timer/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: Number(projectId),
        }),
      });
      const created = await safeJson(res);
      if (!res.ok) throw new Error((created as any)?.error || res.statusText);
      const proj = projects.find((p) => p.id === Number(projectId));
      const withProj = proj
        ? { ...created, project: { id: proj.id, name: proj.name } }
        : created;
      setEntries((prev) => [withProj, ...prev]);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const stopEntry = async (id: number) => {
    if (!token) return;
    try {
      const res = await fetch("/api/timer/stop", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const updated = await safeJson(res);
      if (!res.ok) throw new Error((updated as any)?.error || res.statusText);
      setEntries((prev) =>
        prev.map((e) => (e.id === id ? updated : e))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitEntry = async (e: FormEvent) => {
    e.preventDefault();
    if (!token || clientId === "" || projectId === "") return;
    if (role === "STAFF" && entries.some((e) => !e.endTs)) return;
    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/time-entries/${editingId}`
        : "/api/time-entries";
      const method = editingId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: Number(projectId),
          startTs,
          endTs,
          notes,
        }),
      });
      const created = await safeJson(res);
      if (!res.ok) throw new Error((created as any)?.error || res.statusText);
      if (editingId) {
        setEntries((prev) =>
          prev.map((e) => (e.id === editingId ? created : e))
        );
      } else {
        const proj = projects.find((p) => p.id === Number(projectId));
        const withProj = proj
          ? { ...created, project: { id: proj.id, name: proj.name } }
          : created;
        setEntries((prev) => [withProj, ...prev]);
      }
      setEditingId(null);
      setClientId("");
      setProjectId("");
      setStartTs("");
      setEndTs("");
      setNotes("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const editEntry = (entry: TimeEntry) => {
    setEditingId(entry.id);
    setProjectId(entry.projectId);
    setStartTs(entry.startTs.slice(0, 16));
    setEndTs(entry.endTs ? entry.endTs.slice(0, 16) : "");
    setNotes(entry.notes || "");
  };

  // auto-submit helper for quick entry
  const tryAutoQuickSubmit = async () => {
    if (submitting) return;
    if (!quickDate || !quickHours || projectId === "") return;
    await addQuickHours();
  };

  const addQuickHours = async () => {
    if (!token || projectId === "" || !quickDate || !quickHours) return;
    const hrs = Number(quickHours);
    if (isNaN(hrs) || hrs <= 0) { alert('Enter valid hours'); return; }
    setSubmitting(true);
    try {
      // start at 00:00 local time
      const start = `${quickDate}T00:00`;
      const startDate = new Date(start);
      const endDate = new Date(startDate.getTime() + hrs * 60 * 60 * 1000);
      const fmt = (d: Date) => {
        const pad = (n:number)=>String(n).padStart(2,'0');
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
      };
      const url = isAdmin && selectedUserId !== "" ? '/api/admin/time-entries' : '/api/time-entries';
      const body:any = {
          projectId: Number(projectId),
          startTs: fmt(startDate),
          endTs: fmt(endDate),
          notes
      };
      if (isAdmin && selectedUserId !== "") body.userId = Number(selectedUserId);
      const res = await fetch(url,{
        method:'POST',
        headers:{'Content-Type':'application/json', Authorization:`Bearer ${token}`},
        body: JSON.stringify(body)
      });
      const created = await safeJson(res);
      if(!res.ok) throw new Error((created as any)?.error || res.statusText);
      const proj = projects.find(p=>p.id===Number(projectId));
      const withProj = proj ? { ...created, project: { id: proj.id, name: proj.name } } : created;
      setEntries(prev=>[withProj, ...prev]);
      // reset quick fields
      setQuickDate(""); setQuickHours(""); setNotes("");
    } catch(err:any){
      alert(err.message);
    } finally { setSubmitting(false); }
  };

  const deleteEntry = async (id: number) => {
    if (!confirm("Delete this entry?")) return;
    if (!token) return;
    try {
      const res = await fetch(`/api/time-entries/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error((data as any)?.error || res.statusText);
      setEntries((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(err.message);
    }
  };

  // ---------- RENDER ----------
  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Time Entries</h1>
        <p className="text-slate-400 font-light max-w-xl">
          Track billable hours and manage your daily legal activities.
        </p>
      </header>

      {/* summary cards */}
      {(() => {
        const minutesForEntry = (e: TimeEntry) => {
          if (!e.endTs) return (now - new Date(e.startTs).getTime()) / 60000;
          return e.durationMins;
        };
        const isToday = (d: Date) => d.toDateString() === new Date().toDateString();
        const todayMins = entries.filter((e) => isToday(new Date(e.startTs))).reduce((s, e) => s + minutesForEntry(e), 0);
        
        const nowDate = new Date();
        const weekStart = new Date(nowDate);
        weekStart.setDate(nowDate.getDate() - nowDate.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 7);
        const weekMins = entries.filter((e) => {
          const d = new Date(e.startTs);
          return d >= weekStart && d < weekEnd;
        }).reduce((s, e) => s + minutesForEntry(e), 0);

        const fmt = (mins: number) => {
          const h = Math.floor(mins / 60);
          const m = Math.round(mins % 60);
          return `${h}h ${m}m`;
        };

        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            <div className="legal-card p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Today's Total</p>
                <p className="text-3xl font-serif text-white">{fmt(todayMins)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-legal-gold/5 flex items-center justify-center text-legal-gold">
                <Clock className="w-6 h-6" />
              </div>
            </div>
            <div className="legal-card p-6 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">Weekly Total</p>
                <p className="text-3xl font-serif text-white">{fmt(weekMins)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-legal-gold/5 flex items-center justify-center text-legal-gold">
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })()}

      {/* active timer */}
      {entries.some((e) => !e.endTs) && (
        (() => {
          const active = entries.find((e) => !e.endTs)!;
          const elapsedMs = now - new Date(active.startTs).getTime();
          const hrs = Math.floor(elapsedMs / 3600000);
          const mins = Math.floor((elapsedMs % 3600000) / 60000);
          const secs = Math.floor((elapsedMs % 60000) / 1000);
          const pad = (n: number) => n.toString().padStart(2, "0");
          return (
            <div className="mb-12 flex items-center justify-between gap-6 rounded-xl bg-amber-500/10 border border-amber-500/20 p-8 animate-pulse">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-amber-500 animate-ping absolute inset-0"></div>
                  <div className="w-4 h-4 rounded-full bg-amber-500 relative z-10"></div>
                </div>
                <div>
                  <span className="text-2xl font-serif text-amber-400 block leading-none mb-1">
                    {pad(hrs)}:{pad(mins)}:{pad(secs)}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-amber-500/60 font-bold">
                    Active Session: {active.project?.name}
                  </span>
                </div>
              </div>
              <button
                onClick={() => stopEntry(active.id)}
                className="btn-legal bg-red-500 border-red-500 hover:text-red-500 hover:border-red-500 px-8 py-3"
              >
                Stop Timer
              </button>
            </div>
          );
        })()
      )}

      {/* Forms Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-12">
        {/* quick add */}
        <div className="legal-card p-8">
          <h3 className="text-xl font-serif text-white mb-8">Quick Entry</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            {isAdmin && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500">Lawyer</label>
                <select
                  value={selectedUserId}
                  onChange={(e)=>setSelectedUserId(e.target.value? Number(e.target.value):"")}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                >
                  <option value="">Myself</option>
                  {lawyers.map(l=> (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Client</label>
              <select
                value={clientId}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : "";
                  setClientId(val);
                  setProjectId("");
                }}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                required
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Project</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value ? Number(e.target.value) : "")}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                required
              >
                <option value="">Select project</option>
                {projects.filter((p) => clientId !== "" && p.clientId === clientId).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Date</label>
              <input type="date" value={quickDate} onChange={(e)=>setQuickDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Hours</label>
              <input type="number" step="0.25" min="0" placeholder="0.00" value={quickHours} onChange={(e)=>setQuickHours(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
            </div>
            <div className="flex items-end">
              <button type="button" onClick={addQuickHours} className="btn-legal w-full h-[42px]" disabled={submitting || clientId==="" || projectId===""}>
                Add Hours
              </button>
            </div>
          </div>
        </div>

        {/* manual timer */}
        <div className="legal-card p-8">
          <h3 className="text-xl font-serif text-white mb-8">Manual Entry & Timer</h3>
          <form onSubmit={submitEntry} className="space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500">Start Time</label>
                <input type="datetime-local" value={startTs} onChange={(e) => setStartTs(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500">End Time</label>
                <input type="datetime-local" value={endTs} onChange={(e) => setEndTs(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500">Notes</label>
              <input type="text" placeholder="Description of work..." value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" />
            </div>
            <div className="flex gap-4 pt-2">
              <button type="submit" className="btn-legal flex-1 h-[42px]" disabled={submitting}>
                {submitting ? "Saving..." : editingId ? "Save Entry" : "Add Entry"}
              </button>
              <button type="button" onClick={startTimer} className="btn-legal-outline flex-1 h-[42px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" disabled={submitting || clientId === "" || projectId === "" || role === "STAFF" && entries.some((e) => !e.endTs)}>
                Start Timer
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* history table */}
      <div className="legal-card overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Project</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Duration</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Notes</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500">Loading history...</td></tr>
              ) : error ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-red-400">{error}</td></tr>
              ) : entries.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 italic font-light">No time entries recorded.</td></tr>
              ) : (
                entries.map((e) => {
                  const isActive = !e.endTs;
                  const duration = isActive ? (Date.now() - new Date(e.startTs).getTime()) / 60000 : e.durationMins;
                  return (
                    <tr key={e.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(e.startTs).toLocaleString()}</td>
                      <td className="px-8 py-6 text-slate-200">{e.project?.name}</td>
                      <td className="px-8 py-6 text-right font-bold text-legal-gold">{(duration / 60).toFixed(2)}h</td>
                      <td className="px-8 py-6 text-slate-400 text-sm font-light max-w-xs truncate">{e.notes}</td>
                      <td className="px-8 py-6">
                        <div className="flex items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          {isActive ? (
                            <button onClick={() => stopEntry(e.id)} className="text-amber-400 hover:text-amber-300 transition-colors">Stop</button>
                          ) : (
                            <>
                              <button onClick={() => editEntry(e)} className="text-slate-400 hover:text-legal-gold transition-colors">Edit</button>
                              <button onClick={() => deleteEntry(e.id)} className="text-slate-400 hover:text-red-400 transition-colors">Delete</button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}