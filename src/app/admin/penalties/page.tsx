"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CurrencyCode } from "@prisma/client";
import { fetchAuth } from "@/lib/fetchAuth";
import Link from "next/link";

interface EmployeeOption {
  id: number;
  name: string;
}

interface Penalty {
  id: number;
  employeeId: number;
  employee: { name: string };
  amount: string;
  currency: CurrencyCode;
  date: string;
  reason: string | null;
}

export default function PenaltiesPage() {
  const [penalties, setPenalties] = useState<Penalty[]>([]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [nameFilter, setNameFilter] = useState("");

  // add form
  const [employeeId, setEmployeeId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [days,setDays]=useState<string>("");
  const [currency, setCurrency] = useState<CurrencyCode>("USD" as CurrencyCode);
  const [reason, setReason] = useState<string>("");

  async function fetchData() {
    const [penRes, empRes] = await Promise.all([
      fetchAuth("/api/penalties"),
      fetchAuth("/api/employees"),
    ]);
    const penJson = await penRes.json();
    const empJson = await empRes.json();
    setPenalties(penJson);
    setEmployees(empJson.map((e: any) => ({ id: e.id, name: e.name })));
  }

  const filteredPenalties = penalties.filter((p) =>
    !nameFilter
      ? true
      : p.employee?.name?.toLowerCase().includes(nameFilter.toLowerCase())
  );

  useEffect(() => {
    fetchData();
  }, []);

  async function addPenalty() {
    if (!employeeId || (!amount && !days)) return toast.error("حدد المبلغ أو الأيام");
    const body:any = { employeeId: Number(employeeId), currency, reason };
    if(amount) body.amount = parseFloat(amount);
    if(days) body.days = parseFloat(days);
    const res = await fetchAuth("/api/penalties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return toast.error("Failed");
    toast.success("Penalty added");
    setEmployeeId("");
    setAmount("");
    setDays("");
    setReason("");
    fetchData();
  }

  async function deletePenalty(id: number) {
    if (!confirm("Delete penalty?")) return;
    const res = await fetchAuth(`/api/penalties/${id}`, { method: "DELETE" });
    if (!res.ok) return toast.error("Failed");
    toast.success("Deleted");
    setPenalties(penalties.filter((p) => p.id !== id));
  }

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Penalties</h1>
            <p className="text-slate-400 font-light max-w-xl">Manage disciplinary deductions and employee performance adjustments.</p>
          </div>
          <div className="flex gap-3">
            <input
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-64"
              placeholder="Filter by employee name..."
            />
          </div>
        </div>
      </header>

      {/* add form */}
      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Record New Penalty</h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Employee</label>
            <select 
              value={employeeId} 
              onChange={(e)=>setEmployeeId(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              <option value="" className="bg-slate-900">-- Select Employee --</option>
              {employees.map(emp=> <option key={emp.id} value={emp.id} className="bg-slate-900">{emp.name}</option>)}
            </select>
          </div>
          <div className="space-y-2 w-32">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Amount</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e)=>setAmount(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
              placeholder="0.00" 
            />
          </div>
          <div className="space-y-2 w-24">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Days</label>
            <input 
              type="number" 
              value={days} 
              onChange={(e)=>setDays(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
              placeholder="e.g. 2" 
            />
          </div>
          <div className="space-y-2 w-32">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Currency</label>
            <select 
              value={currency} 
              onChange={(e)=>setCurrency(e.target.value as CurrencyCode)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              {Object.values(CurrencyCode).map(c=> <option key={c} value={c} className="bg-slate-900">{c}</option>)}
            </select>
          </div>
          <div className="space-y-2 flex-1 min-w-[250px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Reason / Memo</label>
            <input 
              value={reason} 
              onChange={(e)=>setReason(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
              placeholder="Reason for penalty..."
            />
          </div>
          <button onClick={addPenalty} className="btn-legal px-8 h-[42px]">Add Penalty</button>
        </div>
      </div>

      {/* table */}
      <div className="legal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Employee</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Amount</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Reason</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredPenalties.length === 0 ? (
                <tr><td colSpan={5} className="px-8 py-16 text-center text-slate-500 italic font-light">No penalty records found.</td></tr>
              ) : (
                filteredPenalties.map(p=> (
                  <tr key={p.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="px-8 py-6">
                      <Link href={`/admin/employees/${p.employeeId}`} className="text-slate-200 hover:text-legal-gold transition-colors font-medium underline decoration-legal-gold/20">
                        {p.employee?.name}
                      </Link>
                    </td>
                    <td className="px-8 py-6 text-red-400 font-bold font-mono">-{p.amount} <span className="text-[10px] ml-1">{p.currency}</span></td>
                    <td className="px-8 py-6 text-slate-400 font-light italic">{p.reason ?? "-"}</td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={()=>deletePenalty(p.id)} 
                        className="text-slate-500 hover:text-red-400 transition-colors text-xs font-bold uppercase tracking-widest"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
