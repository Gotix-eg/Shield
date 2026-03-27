"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";
import Link from "next/link";

interface Salary {
  id: number;
  amount: string;
  currency: string;
  effectiveFrom: string;
}
interface Employee {
  id: number;
  name: string;
  status: string;
  email?: string;
  department?: string;
  hireDate?: string;
  leaveBalanceDays?: number;
  salaries: Salary[];
  user?: { positionId?: number; role?: string };
}

interface Penalty {
  id: number;
  date: string;
  amount: string;
  currency: string;
  reason: string | null;
}

interface Position {
  id: number;
  name: string;
}

const ROLE_OPTIONS = [
  "LAWYER",
  "LAWYER_MANAGER",
  "LAWYER_PARTNER",
  "MANAGING_PARTNER",
  "ACCOUNTANT_MASTER",
  "ACCOUNTANT_ASSISTANT",
  "HR_MANAGER",
  "HR",
  "ADMIN",
  "ADMIN_REPORTS",
  "OWNER",
];

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [emp, setEmp] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSalary, setNewSalary] = useState({ amount: "", currency: "USD" });
  const [emailEdit, setEmailEdit] = useState<string>("");
  const [deptEdit,setDeptEdit]=useState<string>("");
  const [pwd,setPwd]=useState<string>("");
  const [statusEdit, setStatusEdit] = useState<string>("ACTIVE");
  const [balanceEdit, setBalanceEdit] = useState<number>(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionEdit, setPositionEdit] = useState<number | null>(null);
  const [roleEdit, setRoleEdit] = useState<string | null>(null);
  const [projects,setProjects]=useState<{id:number;name:string}[]>([]);
  const [lawyers,setLawyers]=useState<{id:number;name:string}[]>([]);
  const [projectIds,setProjectIds]=useState<number[]>([]);
  const [lawyerIds,setLawyerIds]=useState<number[]>([]);
  const [isHR,setIsHR]=useState(false);

  const fetchEmp = async () => {
    // fetch employee details
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setEmp(data);
      setProjectIds(data.projectIds ?? []);
      setLawyerIds(data.lawyerIds ?? []);
      setEmailEdit(data.email || "");
      setDeptEdit(data.department||"");
      setStatusEdit(data.status);
      setBalanceEdit(Number(data.leaveBalanceDays||0));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPens = async () => {
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/penalties?employeeId=${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok){
        setPenalties([]);
        return; // silently ignore
      }
      const data = await res.json();
      setPenalties(data);
    } catch (err:any) {
      console.error(err);
      setError(err.message || 'Failed to load penalties');
    }
  };

  useEffect(() => {
    fetchEmp();
    fetchPens();
    // fetch dropdown data
    const token=getAuth();
    fetch('/api/projects',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>Array.isArray(d)?setProjects(d):setProjects([]));
    fetch('/api/lawyers',{headers:{Authorization:`Bearer ${token}`}}).then(r=>r.json()).then(d=>Array.isArray(d)?setLawyers(d):setLawyers([]));
    const fetchPositions = async () => {
      try {
        const token = getAuth();
        const res = await fetch('/api/positions', { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) return;
        const data = await res.json();
        setPositions(data);
      } catch {}
    };
    fetchPositions();
    const tok=getAuth();
    const dec:any = tok ? JSON.parse(atob(tok.split('.')[1])):{};
    setIsHR(dec.role==='ADMIN'||dec.role==='HR_MANAGER'||dec.role==='OWNER');
  }, [id]);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: emailEdit }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: statusEdit }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleAddSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ salaryAmount: newSalary.amount, salaryCurrency: newSalary.currency }),
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
      setNewSalary({ amount: "", currency: newSalary.currency });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdatePosition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (positionEdit === null) return;
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ positionId: positionEdit })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    // allow saving even if role not changed
  const roleToSend = roleEdit ?? emp?.user?.role;
  if(!roleToSend) return;
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: roleToSend, projectIds, lawyerIds })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSaveBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch(`/api/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leaveBalanceDays: balanceEdit })
      });
      if (!res.ok) throw new Error(await res.text());
      await fetchEmp();
    } catch (e:any) {
      setError(e.message);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-legal-gold/10 border border-legal-gold/20 flex items-center justify-center text-2xl font-serif text-legal-gold shadow-2xl">
              {emp.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">{emp.name}</h1>
              <div className="flex items-center gap-4">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                  emp.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                }`}>
                  {emp.status}
                </span>
                <span className="text-slate-500 text-xs font-light">Employee ID: #{emp.id}</span>
              </div>
            </div>
          </div>
          <Link href="/admin/employees" className="btn-legal-outline">Back to Directory</Link>
        </div>
      </header>

      {error && <p className="text-red-400 mb-8 bg-red-400/10 p-4 rounded-lg border border-red-400/20">{error}</p>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Details */}
        <div className="lg:col-span-2 space-y-8">
          <div className="legal-card p-8">
            <h3 className="text-xl font-serif text-white mb-8">Professional Profile</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Email Address</p>
                  <p className="text-slate-200 font-medium">{emp.email || "No email provided"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Department</p>
                  <p className="text-slate-200 font-medium">{emp.department || "General Administration"}</p>
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Current Role</p>
                  <p className="text-legal-gold font-bold">{emp.user?.role || "STAFF"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Hire Date</p>
                  <p className="text-slate-200 font-medium">{emp.hireDate ? new Date(emp.hireDate).toLocaleDateString() : "—"}</p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-12 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Update department */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Update Department</label>
                <form onSubmit={async(e)=>{
                  e.preventDefault();setAdding(true);setError(null);
                  try{
                    const token=getAuth();
                    const res=await fetch(`/api/employees/${id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({department:deptEdit})});
                    if(!res.ok) throw new Error(await res.text());
                    await fetchEmp();
                  }catch(err:any){setError(err.message);}finally{setAdding(false);}            
                }} className="flex gap-2">
                  <input className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors" value={deptEdit} onChange={(e)=>setDeptEdit(e.target.value)} />
                  <button disabled={adding} className="btn-legal px-4 text-[10px]">{adding?'...':'Save'}</button>
                </form>
              </div>

              {/* Update status */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Employee Status</label>
                <form onSubmit={handleUpdateStatus} className="flex gap-2">
                  <select value={statusEdit} onChange={(e)=>setStatusEdit(e.target.value)} className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors">
                    {['ACTIVE','INACTIVE'].map(s=><option key={s} className="bg-slate-900">{s}</option>)}
                  </select>
                  <button disabled={adding} className="btn-legal px-4 text-[10px]">
                    {adding? '...':'Update'}
                  </button>
                </form>
              </div>

              {/* Position */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Professional Position</label>
                <form onSubmit={handleUpdatePosition} className="flex gap-2">
                  <select
                    value={positionEdit ?? emp?.user?.positionId ?? ''}
                    onChange={(e)=>setPositionEdit(Number(e.target.value) || null)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  >
                    <option value="" className="bg-slate-900">— Select Position —</option>
                    {positions.map(p=>(<option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>))}
                  </select>
                  <button disabled={adding || positionEdit===null} className="btn-legal px-4 text-[10px]">
                    {adding? '...':'Save'}
                  </button>
                </form>
              </div>

              {/* Role */}
              <div className="space-y-4">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Role</label>
                <form onSubmit={handleUpdateRole} className="flex gap-2">
                  <select
                    value={roleEdit ?? emp?.user?.role ?? ''}
                    onChange={(e)=>setRoleEdit(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  >
                    <option value="" className="bg-slate-900">— Select Role —</option>
                    {ROLE_OPTIONS.map(r=>(<option key={r} value={r} className="bg-slate-900">{r}</option>))}
                  </select>
                  <button disabled={adding} className="btn-legal px-4 text-[10px]">
                    {adding? '...':'Update'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* Managed Scope Section (Conditional) */}
          {(['LAWYER_MANAGER','LAWYER_PARTNER','MANAGING_PARTNER'].includes(roleEdit ?? emp?.user?.role as string)) && (
            <div className="legal-card p-8 space-y-8">
              <h3 className="text-xl font-serif text-white">Management Scope</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Assigned Projects ({projectIds.length})</label>
                  <div className="max-h-60 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 custom-scrollbar">
                    {projects.map(p => (
                      <label key={p.id} className="flex items-center gap-3 group cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={projectIds.includes(p.id)} 
                          onChange={e=>{
                            const next = e.target.checked ? [...projectIds,p.id] : projectIds.filter(id=>id!==p.id);
                            setProjectIds(next);
                          }}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all"
                        />
                        <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{p.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Supervised Lawyers ({lawyerIds.length})</label>
                  <div className="max-h-60 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-4 space-y-2 custom-scrollbar">
                    {lawyers.map(l => (
                      <label key={l.id} className="flex items-center gap-3 group cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={lawyerIds.includes(l.id)} 
                          onChange={e=>{
                            const next = e.target.checked ? [...lawyerIds,l.id] : lawyerIds.filter(id=>id!==l.id);
                            setLawyerIds(next);
                          }}
                          className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all"
                        />
                        <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors">{l.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Salary History */}
          <div className="legal-card overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">Salary Evolution</h3>
              <span className="text-[10px] uppercase tracking-widest text-slate-500">{emp.salaries.length} records</span>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-legal-gold">Effective From</th>
                  <th className="px-8 py-4 text-[10px] uppercase tracking-widest font-bold text-legal-gold text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {emp.salaries.length === 0 ? (
                  <tr><td colSpan={2} className="px-8 py-12 text-center text-slate-500 italic font-light">No salary history records found.</td></tr>
                ) : (
                  emp.salaries.map((s) => (
                    <tr key={s.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-8 py-5 text-slate-400 font-mono text-xs">{new Date(s.effectiveFrom).toLocaleDateString()}</td>
                      <td className="px-8 py-5 text-right font-bold text-legal-gold">{Number(s.amount).toLocaleString()} <span className="text-[10px] opacity-60 ml-1">{s.currency}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <div className="p-8 bg-white/5 border-t border-white/5">
              <form onSubmit={handleAddSalary} className="flex flex-wrap items-end gap-6">
                <div className="space-y-2 flex-1 min-w-[150px]">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">New Amount</label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={newSalary.amount}
                    onChange={(e) => setNewSalary({ ...newSalary, amount: e.target.value })}
                  />
                </div>
                <div className="space-y-2 w-32">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Currency</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={newSalary.currency}
                    onChange={(e) => setNewSalary({ ...newSalary, currency: e.target.value })}
                  >
                    {["USD", "EUR", "EGP", "SAR", "AED", "QAR", "KWD", "OMR", "JPY", "CNY", "INR"].map((c) => (
                      <option key={c} className="bg-slate-900">{c}</option>
                    ))}
                  </select>
                </div>
                <button disabled={adding} className="btn-legal px-8 h-[38px]">
                  {adding ? "Adding…" : "Add Salary Entry"}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          {/* Account Security */}
          <div className="legal-card p-8 space-y-8">
            <h3 className="text-xl font-serif text-white">Security & Access</h3>
            
            <div className="space-y-4">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Account Email</label>
              <form onSubmit={handleUpdateEmail} className="flex flex-col gap-3">
                <input
                  type="email"
                  required
                  className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  value={emailEdit}
                  onChange={(e) => setEmailEdit(e.target.value)}
                />
                <button disabled={adding} className="btn-legal w-full py-2.5 text-[10px]">
                  {adding ? "Saving…" : "Update Email"}
                </button>
              </form>
            </div>

            <div className="space-y-4 pt-8 border-t border-white/5">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Reset Password</label>
              <form onSubmit={async(e)=>{e.preventDefault();if(!pwd)return;setAdding(true);setError(null);
                try{
                  const token=getAuth();
                  const res=await fetch(`/api/employees/${id}`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({password:pwd})});
                  if(!res.ok) throw new Error(await res.text());
                  setPwd("");
                  alert('Password updated');
                }catch(err:any){setError(err.message);}finally{setAdding(false);}        
              }} className="flex flex-col gap-3">
                <input type="password" required className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors" value={pwd} onChange={(e)=>setPwd(e.target.value)} placeholder="New secure password" />
                <button disabled={adding} className="btn-legal w-full py-2.5 text-[10px]">{adding?'Saving…':'Update Password'}</button>
              </form>
            </div>

            {isHR && (
              <div className="space-y-4 pt-8 border-t border-white/5">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Leave Balance (Days)</label>
                <form onSubmit={handleSaveBalance} className="flex gap-3">
                  <input type="number" step="0.1" className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors" value={balanceEdit} onChange={(e)=>setBalanceEdit(Number(e.target.value))} />
                  <button disabled={adding} className="btn-legal px-4 text-[10px]">{adding? '...':'Save'}</button>
                </form>
              </div>
            )}
          </div>

          {/* Penalties Summary */}
          <div className="legal-card overflow-hidden">
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-xl font-serif text-white">Penalties</h3>
              <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded-full">{penalties.length}</span>
            </div>
            <div className="divide-y divide-white/5">
              {penalties.length === 0 ? (
                <div className="px-8 py-12 text-center text-slate-500 italic font-light text-sm">No disciplinary records.</div>
              ) : (
                penalties.map((p) => (
                  <div key={p.id} className="px-8 py-4 hover:bg-white/5 transition-colors group">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-slate-400 font-mono text-[10px]">{new Date(p.date).toLocaleDateString()}</span>
                      <span className="text-red-400 font-bold text-xs">-{p.amount} {p.currency}</span>
                    </div>
                    <p className="text-slate-500 text-[11px] font-light italic truncate group-hover:text-slate-300 transition-colors">{p.reason ?? "Disciplinary deduction"}</p>
                  </div>
                ))
              )}
            </div>
            {penalties.length > 0 && (
              <div className="p-6 bg-white/5 text-center">
                <Link href="/admin/penalties" className="text-[10px] uppercase tracking-widest text-legal-gold font-bold hover:underline">View All Penalties →</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
