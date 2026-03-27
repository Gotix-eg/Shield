'use client';

import useSWR, { mutate } from 'swr';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronRight, Trash2, ExternalLink, Plus } from 'lucide-react';

const fetcher = async (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error('Failed');
  return res.json();
};

function BanksSection() {
  const { data, isLoading } = useSWR('/api/banks', fetcher);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('EGP');
  if (isLoading) return null;
  const banks = Array.isArray(data) ? data : [];
  return (
    <div className="legal-card p-6 border-dashed border-white/10">
      <h3 className="text-lg font-serif text-white mb-6">Linked Accounts</h3>
      <div className="space-y-4 mb-8">
        {banks.map((b:any)=>(
          <div key={b.id} className="flex justify-between items-center py-2 border-b border-white/5">
            <span className="text-sm text-slate-400">{b.name}</span>
            <span className="text-sm font-bold text-legal-gold">{Number(b.balance).toLocaleString()} {b.currency}</span>
          </div>
        ))}
      </div>
      <form className="flex gap-2 items-center" onSubmit={async(e)=>{e.preventDefault();if(!name)return;const res=await fetch('/api/banks',{method:'POST',headers,body:JSON.stringify({companyId:1,name,currency})});if(res.ok){mutate('/api/banks');setName('');}else{alert('Save failed');}}}>
        <input value={name} onChange={(e)=>setName(e.target.value)} placeholder="New Bank..." className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-legal-gold/50 transition-colors" />
        <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white focus:border-legal-gold/50 transition-colors">
          {['EGP','USD','EUR','SAR','GBP'].map(c=>(<option key={c} value={c}>{c}</option>))}
        </select>
        <button type="submit" className="btn-legal px-4 py-1.5 text-[10px]">Add</button>
      </form>
    </div>
  );
}

function ClientSummary({ clientId, projectId }: { clientId: number | null; projectId: number | null }) {
  const params = [] as string[];
  if (clientId !== null) params.push(`clientId=${clientId}`);
  if (projectId !== null) params.push(`projectId=${projectId}`);
  const url = params.length ? `/api/trust-accounts?${params.join('&')}` : '/api/trust-accounts';
  const { data, isLoading, error } = useSWR(url, fetcher);
  if (isLoading || error) return null;
  const rows: Record<string, Record<string, number>> = {};
  (Array.isArray(data) ? data : []).forEach((acct: any) => {
    const client = acct.client?.name || '—';
    rows[client] ??= {};
    rows[client][acct.currency] = (rows[client][acct.currency] || 0) + Number(acct.balance);
  });
  const clientNames = Object.keys(rows);
  if (clientNames.length === 0) return null;
  return (
    <div className="legal-card p-6">
      <h3 className="text-lg font-serif text-white mb-6">Portfolio Summary</h3>
      <div className="space-y-6">
        {clientNames.map((client) => (
          <div key={client} className="space-y-2">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">{client}</p>
            {Object.entries(rows[client]).map(([cur, bal]) => (
              <div key={cur} className="flex justify-between items-baseline border-b border-white/5 pb-2">
                <span className="text-slate-400 text-xs">{cur}</span>
                <span className={`text-lg font-serif ${bal < 0 ? 'text-red-400' : 'text-white'}`}>{bal.toLocaleString()}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Table({ clientId, projectId, onSelect, selectedId }: { clientId: number | null; projectId: number | null; onSelect: (accountId: number) => void; selectedId: number | null }) {
  const params = [] as string[];
  if (clientId !== null) params.push(`clientId=${clientId}`);
  if (projectId !== null) params.push(`projectId=${projectId}`);
  const url = params.length ? `/api/trust-accounts?${params.join('&')}` : '/api/trust-accounts';
  const { data, isLoading, error } = useSWR(url, fetcher);

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading ledger...</div>;
  if (error) return <div className="p-8 text-center text-red-400">Failed to load data</div>;

  return (
    <div className="legal-card overflow-hidden">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5 border-b border-white/5">
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Client & Project</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Trust Balance</th>
            <th className="px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {Array.isArray(data) && data.length > 0 ? data.map((acct: any) => (
            <tr 
              key={acct.id} 
              className={`group hover:bg-white/5 cursor-pointer transition-colors ${selectedId === acct.id ? 'bg-legal-gold/5' : ''}`} 
              onClick={() => onSelect(acct.id)}
            >
              <td className="px-6 py-5">
                <div className="flex flex-col">
                  <span className="text-white font-medium group-hover:text-legal-gold transition-colors">{acct.client?.name || '—'}</span>
                  <span className="text-xs text-slate-500 font-light">{acct.project?.name || 'Unassigned Project'}</span>
                </div>
              </td>
              <td className={`px-6 py-5 text-right font-serif text-lg ${acct.balance < 0 ? 'text-red-400' : 'text-white'}`}>
                {acct.balance.toLocaleString()} <span className="text-[10px] font-sans font-bold text-slate-500 ml-1">{acct.currency}</span>
              </td>
              <td className="px-6 py-5 text-center">
                <button
                  className="text-slate-500 hover:text-red-400 transition-colors"
                  onClick={async (e) => {
                    e.stopPropagation();
                    if (!confirm('Delete trust account?')) return;
                    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                    const headers = token ? { Authorization: `Bearer ${token}` } : {};
                    const res = await fetch(`/api/trust-accounts/${acct.id}`, { method: 'DELETE', headers });
                    if (res.ok) mutate(url);
                  }}
                >
                  <Trash2 className="w-4 h-4 mx-auto" />
                </button>
              </td>
            </tr>
          )) : (
            <tr><td colSpan={3} className="px-6 py-12 text-center text-slate-500 italic font-light">No trust records found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AddAdvanceForm({ projectId, onSaved }: { projectId: number; onSaved: () => void }) {
  const { data: banks } = useSWR('/api/banks', fetcher);
  const [bankId, setBankId] = useState<number | ''>('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('EGP');
  const [loading, setLoading] = useState(false);

  const banksForCurrency = Array.isArray(banks) ? banks.filter((b:any)=>b.currency===currency) : [];
  useEffect(()=>{
    if(bankId && !banksForCurrency.find((b:any)=>b.id===bankId)) setBankId('');
  }, [currency]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!amount) return;
        setLoading(true);
        try {
          const res = await fetch('/api/advance-payments', {
            method: 'POST',
            headers,
            body: JSON.stringify({ projectId, amount: Number(amount), currency, bankId: bankId || null, accountType: 'TRUST' }),
          });
          if (res.ok) { setAmount(''); onSaved(); }
        } finally { setLoading(false); }
      }}
      className="flex flex-wrap gap-4 items-end bg-white/5 p-6 rounded-xl border border-white/5"
    >
      <div className="space-y-2">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Deposit Amount</label>
        <input type="number" value={amount} onChange={(e)=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors" />
      </div>
      <div className="space-y-2 flex-1">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Funding Bank</label>
        <select value={bankId} onChange={(e)=>setBankId(e.target.value?Number(e.target.value):'')} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors">
          <option value="">{banksForCurrency.length===0 ? 'No bank for this currency' : 'Select Destination Bank'}</option>
          {banksForCurrency.map((b:any)=>(<option key={b.id} value={b.id}>{b.name}</option>))}
        </select>
      </div>
      <div className="space-y-2 w-24">
        <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Currency</label>
        <select value={currency} onChange={(e)=>setCurrency(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors">
          {['EGP','USD','EUR','SAR','GBP'].map(c=>(<option key={c} value={c}>{c}</option>))}
        </select>
      </div>
      <button type="submit" disabled={loading || !amount || !bankId} className="btn-legal px-8 h-[42px]">
        {loading ? 'Processing...' : 'Record Deposit'}
      </button>
    </form>
  );
}

function DetailView({ accountId }: { accountId: number | null }) {
  const { data: acct } = useSWR(accountId ? `/api/trust-accounts/${accountId}` : null, fetcher);
  if (!accountId || !acct) return <div className="legal-card p-12 text-center text-slate-500 italic font-light h-full flex items-center justify-center">Select an account from the list to view details and record deposits.</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="legal-card p-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-serif text-white mb-1">{acct.project?.name}</h2>
            <p className="text-slate-400 font-light">{acct.client?.name}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold mb-2">Available Trust</p>
            <p className="text-4xl font-serif text-white">{Number(acct.balance).toLocaleString()} <span className="text-sm font-sans text-slate-500">{acct.currency}</span></p>
          </div>
        </div>

        <div className="border-t border-white/5 pt-8">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6 flex items-center gap-2">
            <Plus className="w-4 h-4 text-legal-gold" /> Record New Deposit
          </h3>
          <AddAdvanceForm projectId={acct.project?.id} onSaved={()=>mutate(`/api/trust-accounts/${accountId}`)} />
        </div>
      </div>

      <div className="legal-card overflow-hidden">
        <div className="px-8 py-6 border-b border-white/5">
          <h3 className="text-xl font-serif text-white">Trust Ledger</h3>
        </div>
        <TransactionsList accountId={accountId} />
      </div>
    </div>
  );
}

function TransactionsList({ accountId }: { accountId: number | null }) {
  const { data, isLoading } = useSWR(accountId ? `/api/trust-transactions?accountId=${accountId}` : null, fetcher);
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const items = Array.isArray(data) ? data : [];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-white/5 border-b border-white/5">
            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Type</th>
            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-right">Amount</th>
            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold">Memo</th>
            <th className="px-8 py-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold text-center">Receipt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {items.map((t: any) => (
            <tr key={t.id} className="group hover:bg-white/5 transition-colors">
              <td className="px-8 py-5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${t.txnType==='DEBIT' ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                  {t.txnType}
                </span>
              </td>
              <td className={`px-8 py-5 text-right font-serif ${t.txnType==='DEBIT' ? 'text-red-400':'text-white'}`}>
                {t.txnType==='DEBIT'?'-':'+'}{Number(t.amount).toLocaleString()}
              </td>
              <td className="px-8 py-5 text-slate-400 text-sm font-light">{t.description || '—'}</td>
              <td className="px-8 py-5 text-center">
                {t.receiptUrl ? (
                  <a href={t.receiptUrl} target="_blank" rel="noopener" className="text-legal-gold hover:text-white transition-colors">
                    <ExternalLink className="w-4 h-4 mx-auto" />
                  </a>
                ) : '—'}
              </td>
            </tr>
          ))}
          {items.length === 0 && (
            <tr><td colSpan={4} className="px-8 py-12 text-center text-slate-600 italic font-light">No ledger entries.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function ProjectTrustPage() {
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [selectedProject, setSelectedProject] = useState<number | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<number | null>(null);

  const { data: clients } = useSWR('/api/clients', fetcher);
  const projEndpoint = selectedClient !== null ? `/api/projects?clientId=${selectedClient}` : '/api/projects';
  const { data: projects } = useSWR(projEndpoint, fetcher);

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Project Trust Accounts</h1>
            <p className="text-slate-400 font-light max-w-xl">Manage client deposits, advance payments, and project-specific trust funds.</p>
          </div>
          <Link href="/accounts" className="btn-legal-outline">Back to Accounts</Link>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Filters & Summaries */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="legal-card p-8">
            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-6">Filter Ledger</h3>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Client</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  value={selectedClient ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedClient(val ? Number(val) : null);
                    setSelectedProject(null);
                  }}
                >
                  <option value="">All Clients</option>
                  {Array.isArray(clients) && clients.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Project</label>
                <select
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  value={selectedProject ?? ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSelectedProject(val ? Number(val) : null);
                  }}
                  disabled={!selectedClient}
                >
                  <option value="">All Projects</option>
                  {Array.isArray(projects) && projects.map((p: any) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <ClientSummary clientId={selectedClient} projectId={selectedProject} />
          <BanksSection />
        </aside>

        {/* Main Content */}
        <div className="lg:col-span-8 space-y-8">
          <Table 
            clientId={selectedClient} 
            projectId={selectedProject} 
            onSelect={setSelectedAccount} 
            selectedId={selectedAccount}
          />
          <DetailView accountId={selectedAccount} />
        </div>
      </div>
    </div>
  );
}
