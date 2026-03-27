'use client';

import React from 'react';
import useSWR, { mutate } from 'swr';
import { useParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function AddTxnForm({ bankId, currency }: { bankId: number; currency: string }) {
  const [amount, setAmount] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: HeadersInit = token
    ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
    : { 'Content-Type': 'application/json' } as HeadersInit;

  return (
    <form
      className="mt-8 flex flex-wrap gap-4 items-end"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
          const res = await fetch('/api/bank-transactions', {
            method: 'POST',
            headers,
            body: JSON.stringify({ bankId, amount: Number(amount), currency, memo }),
          });
          if (res.ok) {
            setAmount('');
            setMemo('');
            mutate(`/api/banks/${bankId}`);
            mutate(`/api/bank-transactions?bankId=${bankId}`);
          } else {
            alert('Save failed');
          }
        } finally {
          setLoading(false);
        }
      }}
    >
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Amount (+/-)</label>
        <input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-32 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
        />
      </div>
      <div className="space-y-2 flex-1 min-w-[200px]">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Transaction Memo</label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Reason for adjustment..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
        />
      </div>
      <button type="submit" disabled={loading || !amount} className="btn-legal px-8 h-[42px]">
        {loading ? 'Saving…' : 'Add Entry'}
      </button>
    </form>
  );
}

export default function BankDetailPage() {
  const params = useParams();
  const id = (params as any)?.id as string;
  const { data: bankData, isLoading } = useSWR(`/api/banks/${id}`, fetcher);
  const { data: txnsData } = useSWR(id ? `/api/bank-transactions?bankId=${id}` : null, fetcher);
  const bank = bankData as any;
  const txns = Array.isArray(txnsData) ? txnsData : [];
  const router = useRouter();

  if (isLoading) return <div className="dashboard-container">Loading…</div>;

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">{bank.name}</h1>
            <p className="text-slate-400 font-light max-w-xl">Detailed transaction ledger and balance monitoring.</p>
          </div>
          <button onClick={()=>router.back()} className="btn-legal-outline">Back to Banks</button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2">
          <div className="legal-card p-8">
            <h3 className="text-xl font-serif text-white mb-8">Manual Ledger Entry</h3>
            <AddTxnForm bankId={Number(id)} currency={bank.currency} />
          </div>
        </div>
        <div className="lg:col-span-1">
          <div className="legal-card p-8 bg-legal-gold/5 border-legal-gold/20 h-full flex flex-col justify-center">
            <p className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold mb-4">Current Available Balance</p>
            {(() => {
              const sumTxns = txns.reduce((acc:any,t:any)=>acc+Number(t.amount),0);
              const sumAdv = bank.advancePayments.reduce((acc:any,a:any)=>acc+Number(a.amount),0);
              const derived = sumTxns + sumAdv;
              return (
                <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-serif text-white">{derived.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <span className="text-legal-gold font-bold text-sm">{bank.currency}</span>
                </div>
              );
            })()} 
          </div>
        </div>
      </div>

      <div className="legal-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
          <h2 className="text-xl font-serif text-white">Transaction History</h2>
          <span className="text-[10px] uppercase tracking-widest text-slate-500">{txns.length + bank.advancePayments.length} records found</span>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Source / Memo</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {[...txns, ...bank.advancePayments]
                .sort((a:any,b:any)=>new Date(b.createdAt??b.paidOn).getTime()-new Date(a.createdAt??a.paidOn).getTime())
                .map((item:any)=>{
                  const isAdv = !!item.project;
                  const amount = Number(item.amount);
                  return (
                    <tr key={item.id} className="group hover:bg-white/5 transition-colors">
                      <td className={`px-8 py-6 font-bold ${amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {amount >= 0 ? '+' : ''}{amount.toLocaleString()} {item.currency}
                      </td>
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(item.paidOn ?? item.createdAt).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        {isAdv ? (
                          <div className="flex items-center gap-3">
                            <span className="text-slate-200 font-medium">Deposit: {item.project.name}</span>
                            <span className="px-2 py-0.5 rounded bg-legal-gold/10 text-legal-gold text-[10px] font-bold">CLIENT TRUST</span>
                          </div>
                        ) : (
                          <span className="text-slate-300 font-light">{item.memo || 'Manual Adjustment'}</span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-center">
                        <button 
                          className="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest"
                          onClick={async()=>{
                            if(!confirm('Delete transaction record?')) return;
                            const token = typeof window!=='undefined'?localStorage.getItem('token'):null;
                            const headers: HeadersInit = {};
                            if(token) headers['Authorization'] = `Bearer ${token}`;
                            const url = isAdv ? `/api/advance-payments/${item.id}` : `/api/bank-transactions/${item.id}`;
                            const res = await fetch(url, { method:'DELETE', headers });
                            if(res.ok){
                              mutate(`/api/banks/${bank.id}`);
                              mutate(`/api/bank-transactions?bankId=${bank.id}`);
                            } else { alert('Operation failed'); }
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              {(bank.advancePayments.length + txns.length) === 0 && (
                <tr><td colSpan={4} className="px-8 py-16 text-center text-slate-500 italic font-light">No ledger entries found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
