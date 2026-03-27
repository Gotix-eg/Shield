"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface BankTxn {
  id: number;
  date: string;
  amount: number;
  currency: string;
  source: string;
}
interface BankItem {
  id: number;
  name: string;
  currency: string;
  balance: number;
}

export default function BankAccountsReport() {
  const today = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState("2025-01-01");
  const [to, setTo] = useState(today);
  const [data, setData] = useState<BankItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [txnsByBank, setTxnsByBank] = useState<Record<number, BankTxn[]>>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = typeof window!=="undefined" ? localStorage.getItem('token'):null;
      const res = await fetch('/api/banks', { headers: token? { Authorization:`Bearer ${token}` }: {} });
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } finally {
      setLoading(false);
    }
  };

  const loadTxns = async (bankId:number) => {
    const token = typeof window!=="undefined" ? localStorage.getItem('token'):null;
    const headers = token ? { Authorization:`Bearer ${token}` } : {};

    // fetch bank (with advancePayments + project) and bank transactions in parallel
    const [bankRes, txRes] = await Promise.all([
      fetch(`/api/banks/${bankId}`, { headers }),
      fetch(`/api/bank-transactions?bankId=${bankId}`, { headers }),
    ]);
    const bank = bankRes.ok ? await bankRes.json() : null;
    const txnsRaw = txRes.ok ? await txRes.json() : [];

    const txnsArr = Array.isArray(txnsRaw) ? txnsRaw : [];
    const advArr = Array.isArray(bank?.advancePayments) ? bank.advancePayments : [];

    // combine and sort like bank detail page
    const combined = [...txnsArr, ...advArr].sort((a:any,b:any)=>
      new Date(b.createdAt ?? b.paidOn).getTime() - new Date(a.createdAt ?? a.paidOn).getTime()
    ).map((item:any):BankTxn => {
      const isAdv = !!item.project;
      const date = item.paidOn ?? item.createdAt;
      const amount = Number(item.amount);
      const currency = item.currency;
      const source = isAdv
        ? (item.project?.name || 'Project advance')
        : (item.memo || 'Manual');
      return {
        id: item.id,
        date: new Date(date).toISOString(),
        amount,
        currency,
        source,
      };
    });

    setTxnsByBank(prev => ({ ...prev, [bankId]: combined }));
  };

  useEffect(() => { fetchData(); }, []); // initial

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Bank Accounts Report</h1>
            <p className="text-slate-400 font-light max-w-xl">Overview of all firm bank balances and transaction histories.</p>
          </div>
          <Link href="/admin/reports" className="btn-legal-outline">Back to Reports</Link>
        </div>
      </header>

      {/* Filters */}
      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Filter Period</h3>
        <div className="flex gap-6 items-end flex-wrap">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">From Date</label>
            <input 
              type="date" 
              value={from} 
              onChange={e=>setFrom(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">To Date</label>
            <input 
              type="date" 
              value={to} 
              onChange={e=>setTo(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <button onClick={fetchData} className="btn-legal px-8 h-[42px]">Search Accounts</button>
        </div>
      </div>

      <div className="legal-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 italic font-light">Loading bank data...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Bank Name</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.length === 0 ? (
                  <tr><td colSpan={2} className="px-8 py-16 text-center text-slate-500 italic font-light">No bank accounts registered.</td></tr>
                ) : (
                  data.map(item => (
                    <React.Fragment key={item.id}>
                      <tr 
                        className="group hover:bg-white/5 cursor-pointer transition-colors" 
                        onClick={()=>{
                          const nextId = openId===item.id?null:item.id;
                          setOpenId(nextId);
                          if(nextId){ loadTxns(nextId); }
                        }}
                      >
                        <td className="px-8 py-6 text-slate-200 group-hover:text-legal-gold transition-colors font-medium">
                          <div className="flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full transition-colors ${openId === item.id ? 'bg-legal-gold' : 'bg-slate-700'}`}></span>
                            {item.name}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right font-bold text-legal-gold">{item.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-mono opacity-60 ml-1">{item.currency}</span></td>
                      </tr>
                      {openId===item.id && (
                        <tr className="bg-black/20">
                          <td colSpan={2} className="p-0">
                            <div className="px-8 py-6">
                              <table className="w-full text-left border-collapse bg-white/5 rounded-lg overflow-hidden">
                                <thead>
                                  <tr className="bg-white/5 border-b border-white/5">
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Date</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500 text-right">Amount</th>
                                    <th className="px-4 py-3 text-[10px] uppercase tracking-widest font-bold text-slate-500">Memo / Source</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {(txnsByBank[item.id] || []).map(t=> (
                                    <tr key={t.id} className="hover:bg-white/5 transition-colors">
                                      <td className="px-4 py-3 text-slate-400 font-mono text-[10px]">{new Date(t.date).toLocaleDateString()}</td>
                                      <td className={`px-4 py-3 text-right font-bold text-xs ${t.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {t.amount >= 0 ? '+' : ''}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                      </td>
                                      <td className="px-4 py-3 text-slate-300 text-xs font-light italic">{t.source}</td>
                                    </tr>
                                  ))}
                                  {!(txnsByBank[item.id]?.length) && (
                                    <tr><td className="px-4 py-8 text-center text-slate-500 italic font-light text-xs" colSpan={3}>No transactions found for this period.</td></tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
