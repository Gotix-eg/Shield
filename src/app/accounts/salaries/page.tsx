
"use client";
import { useState } from 'react';
import useSWR, { mutate } from 'swr';
import Link from 'next/link';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  return res.json();
};

export default function SalariesApprovePage() {
  const { data: runs, isLoading: loadingRuns } = useSWR('/api/salaries/pending', fetcher);
  const { data: banks } = useSWR('/api/banks', fetcher);

  const [selectedRun, setSelectedRun] = useState<any>(null);
  const [bankId, setBankId] = useState<number | ''>('');
  const [busy, setBusy] = useState(false);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  const approve = async () => {
    if (!selectedRun || !bankId) return;
    setBusy(true);
    const res = await fetch('/api/salaries/approve', {
      method: 'POST',
      headers,
      body: JSON.stringify({ batchId: selectedRun.id, bankId }),
    });
    setBusy(false);
    if (res.ok) {
      alert('Approved successfully');
      setSelectedRun(null);
      setBankId('');
      mutate('/api/salaries/pending');
      mutate('/api/banks');
    } else {
      let msg='Approval failed';
      try {
        const txt = await res.text();
        try{ const j=JSON.parse(txt); msg=j.error||msg; }
        catch{ msg = txt || msg; }
      } catch {}
      alert(msg);
    }
  };

  if (loadingRuns) return <p className="p-8">Loading...</p>;

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Pending Salary Batches</h1>
            <p className="text-slate-400 font-light max-w-xl">Review and authorize pending payroll distributions from firm accounts.</p>
          </div>
          <Link href="/accounts" className="btn-legal-outline">Back to Accounts</Link>
        </div>
      </header>

      {Array.isArray(runs) && runs.length > 0 ? (
        <div className="legal-card overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Period</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Payslips</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Total</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {runs.map((r:any)=>(
                <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-slate-200 font-medium">{r.period}</td>
                  <td className="px-8 py-6 text-right text-slate-400 font-mono text-xs">{r.payslipCount}</td>
                  <td className="px-8 py-6 text-right font-bold text-legal-gold">{r.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-4">
                      <button className="btn-legal-outline px-4 py-1.5 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={()=>{setSelectedRun(r);setBankId('');}}>Approve</button>
                      <button
                        className="btn-legal-outline px-4 py-1.5 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                        onClick={async () => {
                          if (!confirm('Reject and delete this salary batch?')) return;
                          const res = await fetch(`/api/payroll/batches?id=${r.id}`, {
                            method: 'DELETE',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                          });
                          if (!res.ok) {
                            const txt = await res.text().catch(() => '');
                            alert(txt || 'Failed to reject batch');
                            return;
                          }
                          mutate('/api/salaries/pending');
                        }}
                      >
                        Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="legal-card p-16 text-center">
          <p className="text-slate-500 italic font-light">No pending salary batches found.</p>
        </div>
      )}

      {selectedRun && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[200] p-6">
          <div className="legal-card p-8 max-w-md w-full animate-in zoom-in duration-300">
            <h2 className="text-2xl font-serif text-white mb-2">Authorize Distribution</h2>
            <p className="text-slate-400 text-sm mb-8">Authorizing {selectedRun.period} for a total of <span className="text-legal-gold font-bold">{selectedRun.total.toFixed(2)}</span></p>
            
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Select Funding Bank</label>
                <select value={bankId} onChange={(e)=>setBankId(Number(e.target.value))} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus:border-legal-gold/50 transition-colors">
                  <option value="">Choose bank account...</option>
                  {banks?.map((b:any)=>(
                    <option key={b.id} value={b.id}>{b.name} ({b.currency} - Bal: {Number(b.derived ?? b.balance).toFixed(2)})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={approve}
                  disabled={busy || !bankId}
                  className="btn-legal flex-1 py-3"
                >
                  {busy ? 'Processing...' : 'Confirm Approval'}
                </button>
                <button
                  onClick={()=>setSelectedRun(null)}
                  className="btn-legal-outline flex-1 py-3"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
