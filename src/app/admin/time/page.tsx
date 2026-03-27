"use client";
import React, { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";

interface Lawyer { id:number; name:string }
interface Project { id:number; name:string; clientId:number }

export default function AdminTimeEntryPage(){
  const [lawyers,setLawyers]=useState<Lawyer[]>([]);
  const [projects,setProjects]=useState<Project[]>([]);
  const [userId,setUserId]=useState<number | "">("");
  const [projectId,setProjectId]=useState<number | "">("");
  const [date,setDate]=useState("");
  const [hours,setHours]=useState<string>("");
  const [notes,setNotes]=useState("");
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const token = getAuth();

  // expense form state
  const [expDate,setExpDate]=useState("");
  const [expAmount,setExpAmount]=useState<string>("");
  const [expCurrency,setExpCurrency]=useState("USD");
  const [expNotes,setExpNotes]=useState("");
  const [expBillable,setExpBillable]=useState(true);

  useEffect(()=>{
    const load = async()=>{
      try{
        const headers = token? { Authorization:`Bearer ${token}` } : {} as any;
        const [lawyersRes, projRes] = await Promise.all([
          fetch('/api/lawyers',{ headers }),
          fetch('/api/projects',{ headers })
        ]);
        const law = await lawyersRes.json();
        const pro = await projRes.json();
        setLawyers(Array.isArray(law)? law: []);
        setProjects(Array.isArray(pro)? pro: []);
      }catch(e:any){ setError(e.message); }
      finally{ setLoading(false); }
    };
    load();
  },[token]);

  const submitExpense = async (e:React.FormEvent) => {
    e.preventDefault();
    if(!token || userId==="" || projectId==="" || !expDate || !expAmount || !expCurrency) return;
    const amt = Number(expAmount); if(isNaN(amt) || amt<=0){ alert('Enter valid amount'); return; }
    setSaving(true); setError(null);
    try{
      const res = await fetch('/api/admin/expenses',{
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ userId:Number(userId), projectId:Number(projectId), amount:amt, currency:expCurrency, description:expNotes, incurredOn:expDate, billable:expBillable })
      });
      const data = await (async()=>{ const ct=res.headers.get('content-type')||''; return ct.includes('application/json')? res.json(): null; })();
      if(!res.ok) throw new Error((data as any)?.error || res.statusText);
      setExpDate(""); setExpAmount(""); setExpNotes(""); setExpBillable(true);
      alert('Expense added');
    }catch(err:any){ setError(err.message); }
    finally{ setSaving(false); }
  };

  const currentLawyer = typeof userId === 'number' ? lawyers.find(l=>l.id===userId) : null;

  const submit = async(e:React.FormEvent)=>{
    e.preventDefault();
    if(!token || userId==="" || projectId==="" || !date || !hours) return;
    const h = Number(hours); if(isNaN(h) || h<=0){ alert('Enter valid hours'); return; }
    setSaving(true); setError(null);
    try{
      const res = await fetch('/api/admin/time-entries',{
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ userId:Number(userId), projectId:Number(projectId), date, hours:h, notes })
      });
      const data = await (async()=>{ const ct=res.headers.get('content-type')||''; return ct.includes('application/json')? res.json(): null; })();
      if(!res.ok) throw new Error((data as any)?.error || res.statusText);
      setDate(""); setHours(""); setNotes("");
      alert('Time entry added');
    }catch(err:any){ setError(err.message); }
    finally{ setSaving(false); }
  };

  if(loading) return <div className="dashboard-container">Loading…</div>;
  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Admin: Time Entry</h1>
        <p className="text-slate-400 font-light max-w-xl">Log time and expenses on behalf of firm members.</p>
      </header>

      {error && (
        <div className="legal-card p-6 border-red-500/20 bg-red-500/5 mb-8">
          <p className="text-red-400 font-medium">{error}</p>
        </div>
      )}

      <div className="legal-card p-8 mb-12">
        <h2 className="text-2xl font-serif text-white mb-8 flex items-center gap-4">
          Add Time Entry
          {currentLawyer && <span className="text-sm font-sans font-normal text-legal-gold">for {currentLawyer.name}</span>}
        </h2>
        
        <form onSubmit={submit} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Lawyer</label>
            <select value={userId} onChange={e=>setUserId(e.target.value? Number(e.target.value):"")} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
              <option value="">Select Lawyer</option>
              {lawyers.map(l=>(<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Project</label>
            <select value={projectId} onChange={e=>setProjectId(e.target.value? Number(e.target.value):"")} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
              <option value="">Select Project</option>
              {projects.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Date</label>
            <input type="date" value={date} onChange={e=>setDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Hours</label>
            <input type="number" step="0.25" min="0" placeholder="0.00" value={hours} onChange={e=>setHours(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Notes</label>
            <input type="text" placeholder="Description of work performed..." value={notes} onChange={e=>setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 pt-4">
            <button disabled={saving} className="btn-legal px-12 min-w-[160px]">{saving? 'Saving…':'Save Entry'}</button>
          </div>
        </form>
      </div>

      <div className="legal-card p-8">
        <h2 className="text-2xl font-serif text-white mb-8">Add Expense</h2>
        <form onSubmit={submitExpense} className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Lawyer</label>
            <select value={userId} onChange={e=>setUserId(e.target.value? Number(e.target.value):"")} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
              <option value="">Select Lawyer</option>
              {lawyers.map(l=>(<option key={l.id} value={l.id}>{l.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Project</label>
            <select value={projectId} onChange={e=>setProjectId(e.target.value? Number(e.target.value):"")} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
              <option value="">Select Project</option>
              {projects.map(p=>(<option key={p.id} value={p.id}>{p.name}</option>))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Date Incurred</label>
            <input type="date" value={expDate} onChange={e=>setExpDate(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Amount</label>
            <div className="flex gap-2">
              <input type="number" step="0.01" min="0" placeholder="0.00" value={expAmount} onChange={e=>setExpAmount(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
              <select value={expCurrency} onChange={e=>setExpCurrency(e.target.value)} className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-2.5 text-xs text-white focus:border-legal-gold/50 transition-colors">
                {['USD','EUR','EGP','SAR','AED','QAR','KWD','OMR','GBP'].map(c=> (<option key={c} value={c}>{c}</option>))}
              </select>
            </div>
          </div>
          <div className="flex items-end pb-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={expBillable} onChange={e=>setExpBillable(e.target.checked)} className="w-4 h-4 rounded border-white/10 bg-white/5 text-legal-gold focus:ring-legal-gold/50" />
              <span className="text-sm text-slate-400 group-hover:text-white transition-colors">Billable to client</span>
            </label>
          </div>
          <div className="space-y-2 sm:col-span-2 lg:col-span-3">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Description</label>
            <input type="text" placeholder="Detail the expense..." value={expNotes} onChange={e=>setNotes(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" />
          </div>
          <div className="sm:col-span-2 lg:col-span-3 pt-4">
            <button disabled={saving} className="btn-legal-outline px-12 border-legal-gold/30 text-legal-gold hover:bg-legal-gold/10 min-w-[160px]">{saving? 'Saving…':'Save Expense'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
