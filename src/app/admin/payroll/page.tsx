"use client";
import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";



interface Batch {
  id: number;
  month: number;
  year: number;
  status: string;
  items: { id: number; netSalary: number; employee: { name: string } }[];
}

export default function PayrollPage() {

  const [batches, setBatches] = useState<Batch[]>([]);
  const [role,setRole]=useState<string|null>(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);

  const token = getAuth();

  const fetchBatches = async (role:string|null) => {
    const res = await fetch('/api/payroll/batches',{
      headers: token? { Authorization: `Bearer ${token}` } : undefined
    });
    if(res.ok){
      const data:Batch[] = await res.json();
      // filter according to role
      let filtered=data;
      if(!role?.startsWith('ACCOUNTANT')) {
        // غير المحاسبين يرون فقط المسودات
        filtered = data.filter(b=>b.status==='DRAFT');
      }
      setBatches(filtered);
    }
  };

  useEffect(()=>{
    // detect role
    try{ if(token){ setRole(JSON.parse(atob(token.split('.')[1])).role); }}catch{}
  },[]);

  useEffect(() => {
    if(role!==null) fetchBatches(role);
  }, [role]);

  const createBatch = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/payroll/batches',{
        method:'POST',
        headers:{'Content-Type':'application/json', ...(token?{Authorization:`Bearer ${token}`}:{})},
        body:JSON.stringify({year,month})
      });
      if(!res.ok){
        const j=await res.json().catch(()=>({error:'Error'}));
        alert(j.error||'Create failed');
      }
      await fetchBatches(role);
    } finally {
      setLoading(false);
    }
  };

  const hrApprove = async (id: number) => {
    await fetch(`/api/payroll/batches/${id}/hr-approve`,{method:'PUT',headers: token?{Authorization:`Bearer ${token}`}:{} });
    fetchBatches(role);
  };

  const accApprove = async (id: number) => {
    await fetch(`/api/payroll/batches/${id}/acc-approve`,{method:'PUT',headers: token?{Authorization:`Bearer ${token}`}:{} });
    fetchBatches(role);
  };

  const accReverse = async (id: number) => {
    if(!confirm('Undo accountant approval and delete journal?')) return;
    await fetch(`/api/payroll/batches/${id}/acc-reverse`,{method:'DELETE',headers: token?{Authorization:`Bearer ${token}`}:{} });
    fetchBatches(role);
  };

  const deleteDraft = async (id: number) => {
    if (!confirm('Delete this draft payroll batch?')) return;
    try {
      const res = await fetch(`/api/payroll/batches?id=${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text();
        alert(text || 'Failed to delete batch');
        return;
      }
      await fetchBatches(role);
    } catch (e) {
      console.error(e);
      alert('Failed to delete batch');
    }
  };

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Payroll Management</h1>
        <p className="text-slate-400 font-light max-w-xl">Review and approve salary batches and financial records.</p>
      </header>

      <div className="legal-card p-6 mb-8 flex flex-wrap gap-6 items-end">
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Year</label>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-32"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] uppercase tracking-widest text-slate-500">Month</label>
          <input
            type="number"
            min={1}
            max={12}
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-24"
          />
        </div>
        <button
          className="btn-legal px-8 h-[42px]"
          onClick={createBatch}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Create Batch'}
        </button>
      </div>

      <div className="legal-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/5">
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">#</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Period</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Status</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Employees</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Net Total</th>
              <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {batches.map((b) => {
              const net = b.items.reduce((acc, i) => acc + Number(i.netSalary), 0);
              return (
                <tr key={b.id} className="group hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6 text-slate-400 font-mono text-xs">{b.id}</td>
                  <td className="px-8 py-6 text-slate-200">{b.month}/{b.year}</td>
                  <td className="px-8 py-6">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider bg-white/5 border border-white/10 text-slate-400">
                      {b.status}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-slate-400">{b.items.length}</td>
                  <td className="px-8 py-6 font-bold text-legal-gold">{net.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6">
                    <div className="flex items-center justify-center gap-4">
                      {!role?.startsWith('ACCOUNTANT') && b.status === "DRAFT" && (
                        <>
                          <button className="btn-legal-outline px-4 py-1.5 text-[10px] border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10" onClick={() => hrApprove(b.id)}>
                            HR Approve
                          </button>
                          <button
                            className="btn-legal-outline px-4 py-1.5 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteDraft(b.id)}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {role?.startsWith('ACCOUNTANT') && b.status === "HR_APPROVED" && (
                        <button className="btn-legal px-4 py-1.5 text-[10px]" onClick={() => accApprove(b.id)}>
                          Finalize
                        </button>
                      )}
                      {b.status === "ACC_APPROVED" && (
                        <button className="btn-legal-outline px-4 py-1.5 text-[10px] border-red-500/30 text-red-400 hover:bg-red-500/10" onClick={() => accReverse(b.id)}>
                          Reverse
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
