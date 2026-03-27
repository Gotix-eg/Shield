"use client";
import { useState, useEffect } from 'react';
import { getAuth } from '@/lib/auth';

export default function SettingsPage() {
  const [rate,setRate]=useState<string>('');
  const token = getAuth();
  const fetchRate=async()=>{
    const res=await fetch('/api/settings/exchange-rate',{headers: token?{Authorization:`Bearer ${token}`}:{}});
    if(res.ok){const data=await res.json();if(data.rate) setRate(String(data.rate));}
  };
  useEffect(()=>{fetchRate();},[]);
  const save=async()=>{
    if(!rate) return;
    await fetch('/api/settings/exchange-rate',{method:'PUT',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},body:JSON.stringify({rate:Number(rate)})});
    alert('Saved');
  };
  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Exchange Rate</h1>
        <p className="text-slate-400 font-light max-w-xl">Configure the global currency conversion rate for firm-wide financial reporting.</p>
      </header>

      <div className="legal-card p-10 max-w-xl">
        <div className="flex flex-col gap-8">
          <div className="space-y-4">
            <label className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold">Base Conversion (EGP per 1 USD)</label>
            <div className="relative">
              <input 
                type="number" 
                step="0.0001" 
                className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-2xl font-serif text-white focus:border-legal-gold/50 transition-all outline-none" 
                value={rate} 
                onChange={e=>setRate(e.target.value)} 
                placeholder="0.0000"
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold tracking-widest text-xs">EGP / USD</span>
            </div>
          </div>
          
          <button 
            className="btn-legal py-4 text-sm" 
            onClick={save}
          >
            Update Exchange Rate
          </button>

          <p className="text-[10px] text-slate-500 font-light italic text-center">
            * This rate affects all billable hours and expense reports using cross-currency calculations.
          </p>
        </div>
      </div>
    </div>
  );
}
