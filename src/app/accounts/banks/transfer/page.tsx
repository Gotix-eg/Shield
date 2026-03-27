'use client';

import useSWR, { mutate } from 'swr';
import { useState } from 'react';
import Link from 'next/link';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.json();
};

export default function BankTransferPage() {
  const { data: banksData, isLoading } = useSWR('/api/banks', fetcher);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' };

  const banks = Array.isArray(banksData) ? banksData : [];

  const [fromBankId, setFromBankId] = useState<number | ''>('');
  const [toBankId, setToBankId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [rate, setRate] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromBankId || !toBankId || !amount) return;
    setBusy(true);
    const res = await fetch('/api/banks/transfer', {
      method: 'POST',
      headers,
      body: JSON.stringify({ fromBankId, toBankId, amount: Number(amount), notes, rate: rate? Number(rate): undefined }),
    });
    setBusy(false);
    if (res.ok) {
      alert('Transfer successful');
      mutate('/api/banks');
      setAmount('');
      setNotes('');
    } else {
      const j = await res.json();
      alert(j.error || 'Transfer failed');
    }
  };

  if (isLoading) return <p>Loading...</p>;

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Inter-Bank Transfer</h1>
            <p className="text-slate-400 font-light max-w-xl">Move funds securely between firm bank accounts with currency conversion support.</p>
          </div>
          <Link href="/accounts/banks" className="btn-legal-outline">Back to Banks</Link>
        </div>
      </header>

      <div className="legal-card p-10 max-w-2xl">
        <form onSubmit={submit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Source Account</label>
              <select value={fromBankId} onChange={(e)=>setFromBankId(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
                <option value="">Select bank...</option>
                {banks.map((b:any)=>(<option key={b.id} value={b.id}>{`${b.name} (${b.currency})`}</option>))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Destination Account</label>
              <select value={toBankId} onChange={(e)=>setToBankId(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors" required>
                <option value="">Select bank...</option>
                {banks.map((b:any)=>(<option key={b.id} value={b.id}>{`${b.name} (${b.currency})`}</option>))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Transfer Amount</label>
              <input type="number" step="0.01" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
            </div>
            {/* rate field shows only if currencies differ */}
            {(fromBankId && toBankId && banks.find((b:any)=>b.id===fromBankId)?.currency !== banks.find((b:any)=>b.id===toBankId)?.currency) && (
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Exchange Rate (1 {banks.find((b:any)=>b.id===fromBankId)?.currency} = ?)</label>
                <input type="number" step="0.0001" value={rate} onChange={(e)=>setRate(e.target.value)} placeholder="1.0000" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors" required />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Transfer Notes</label>
            <textarea value={notes} onChange={(e)=>setNotes(e.target.value)} placeholder="Reason for transfer..." className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors min-h-[100px]" />
          </div>

          <div className="pt-4">
            <button disabled={busy} type="submit" className="btn-legal px-12 py-4 text-lg w-full md:w-auto">
              {busy ? 'Processing Transfer...' : 'Execute Transfer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
