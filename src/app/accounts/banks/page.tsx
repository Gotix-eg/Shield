'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return res.json();
};

export default function BanksPage() {
  const { data, isLoading } = useSWR('/api/banks', fetcher);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EGP');
  if (isLoading) return <p>Loading...</p>;
  const banks = Array.isArray(data) ? data : [];

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Banks</h1>
            <p className="text-slate-400 font-light max-w-xl">Manage firm bank accounts, balances, and historical ledgers.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/accounts/banks/transfer" className="btn-legal-outline border-legal-gold/30 text-legal-gold hover:bg-legal-gold/10">Transfer Funds</Link>
            <Link href="/accounts/project-trust" className="btn-legal-outline">Back to Trust Accounts</Link>
          </div>
        </div>
      </header>

      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Add New Bank</h3>
        <form className="flex flex-wrap gap-6 items-end" onSubmit={async(e)=>{e.preventDefault();if(!name)return;const res=await fetch('/api/banks',{method:'POST',headers,body:JSON.stringify({name,currency})});if(res.ok){mutate('/api/banks');setName('');}else{alert('Save failed');}}}>
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Bank Name</label>
            <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="e.g. HSBC Business" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" />
          </div>
          <div className="space-y-2 w-32">
            <label className="text-[10px] uppercase tracking-widest text-slate-500">Currency</label>
            <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors">
              {['EGP','USD','EUR','SAR','GBP'].map(c=>(<option key={c} value={c}>{c}</option>))}
            </select>
          </div>
          <button type="submit" className="btn-legal px-8 h-[42px]">Add Bank</button>
        </form>
      </div>

      <div className="legal-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Bank Name</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Currency</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {banks.length === 0 ? (
              <tr><td colSpan={3} className="px-8 py-16 text-center text-slate-500 italic font-light">No bank accounts registered.</td></tr>
            ) : (
              banks.map((b:any)=>(
                <tr key={b.id} className="group hover:bg-white/5 cursor-pointer transition-colors" onClick={()=>location.href=`/accounts/banks/${b.id}` }>
                  <td className="px-8 py-6 text-slate-200 group-hover:text-legal-gold transition-colors font-medium underline decoration-legal-gold/30">{b.name}</td>
                  <td className="px-8 py-6 text-slate-400 font-mono text-xs">{b.currency}</td>
                  <td className="px-8 py-6 text-right font-bold text-legal-gold">{Number((b.derived ?? b.balance)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
