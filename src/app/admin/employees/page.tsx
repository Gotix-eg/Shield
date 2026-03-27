"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";

interface Salary {
  amount: string;
  currency: string;
  effectiveFrom: string;
}
interface Employee {
  email?: string;
  id: number;
  name: string;
  status: string;
  department?: string;
  hireDate?: string;
  leaveBalanceDays?: number;
  salaries: Salary[];
  user?: { role: string };
}

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRole,setCurrentRole]=useState<string|null>(null);

  useEffect(() => {
    const tokenLocal = typeof window!=='undefined'?localStorage.getItem('token'):null;
    if(tokenLocal){
      try{ setCurrentRole(JSON.parse(atob(tokenLocal.split('.')[1])).role);}catch{}
    }
    const fetchData = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
        const res = await fetch("/api/employees", {
          headers: { ...(token ? { ...(token ? { Authorization: `Bearer ${token}` } : {}) } : {}) },
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Employees</h1>
            <p className="text-slate-400 font-light max-w-xl">Manage firm personnel, departments, roles, and payroll information.</p>
          </div>
          {currentRole!=='ADMIN_VIEWER' && (
            <div className="flex gap-3">
              <Link
                href="/admin/employees/new"
                className="btn-legal px-6"
              >
                Add Employee
              </Link>
              <button
                onClick={() => {
                  const rows = [
                    ["ID","Name","Email","Department","Status","Role","Leave Balance","Salary","Currency"]
                  ].concat(
                    data.map(e=>{
                      const latest=e.salaries[0];
                      return [e.id,e.name,e.email??"",e.department??"",e.status,e.user?.role??"",e.leaveBalanceDays??0,latest?latest.amount:"",latest?latest.currency:""];
                    })
                  );
                  const csv = rows.map(r=>r.map(f=>`"${String(f).replace(/"/g,'""')}"`).join(',')).join('\n');
                  const blob = new Blob([csv],{type:'text/csv'});
                  const url = URL.createObjectURL(blob);
                  const a=document.createElement('a');
                  a.href=url; a.download='employees.csv'; a.click(); URL.revokeObjectURL(url);
                }}
                className="btn-legal-outline px-6"
              >
                Export CSV
              </button>
            </div>
          )}
        </div>
      </header>

      {error && <p className="text-red-400 mb-6 bg-red-400/10 p-4 rounded-lg border border-red-400/20">{error}</p>}

      <div className="legal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">ID</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Name</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Department / Role</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Status</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Leave Balance</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Latest Salary</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={7} className="px-8 py-16 text-center text-slate-500 italic font-light">Loading employee directory...</td></tr>
              ) : data.length === 0 ? (
                <tr><td colSpan={7} className="px-8 py-16 text-center text-slate-500 italic font-light">No employees found.</td></tr>
              ) : (
                data.map((e) => {
                  const latest = e.salaries[0];
                  return (
                    <tr key={e.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 text-slate-500 font-mono text-xs">#{e.id}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          {currentRole==='ADMIN_VIEWER'? (
                            <span className="text-slate-200 font-medium">{e.name}</span>
                          ) : (
                            <Link className="text-slate-200 hover:text-legal-gold transition-colors font-medium underline decoration-legal-gold/20" href={`/admin/employees/${e.id}`}>{e.name}</Link>
                          )}
                          <span className="text-slate-500 text-[10px] font-light">{e.email || "No email recorded"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-slate-300 text-xs font-medium">{e.department || "General"}</span>
                          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{e.user?.role ?? "No Role Assigned"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          e.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                        }`}>
                          {e.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        {currentRole==='ADMIN_VIEWER' ? (
                          <span className="text-slate-300 font-mono text-xs">{e.leaveBalanceDays??0} days</span>
                        ) : (
                        <div className="flex justify-end items-center gap-2">
                          <input
                            type="number"
                            className="w-16 bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-legal-gold/50 transition-colors text-right"
                            defaultValue={e.leaveBalanceDays ?? 0}
                            onBlur={async (ev) => {
                              const val = Number((ev.target as HTMLInputElement).value);
                              if (isNaN(val)) return;
                              try {
                                const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                                const res = await fetch(`/api/employees/${e.id}/balance`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    ...(token ? { ...(token ? { Authorization: `Bearer ${token}` } : {}) } : {}),
                                  },
                                  body: JSON.stringify({ leaveBalanceDays: val }),
                                });
                                if (!res.ok) throw new Error(await res.text());
                              } catch (err) {
                                alert("Failed to update balance");
                              }
                            }}
                          />
                          <span className="text-[10px] text-slate-500 uppercase tracking-tighter">days</span>
                        </div>
                        )}
                      </td>
                      <td className="px-8 py-6 text-right">
                        {latest ? (
                          <div className="flex flex-col items-end">
                            <span className="text-legal-gold font-bold">{Number(latest.amount).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{latest.currency}</span>
                          </div>
                        ) : "—"}
                      </td>
                      <td className="px-8 py-6 text-center">
                        {currentRole!=='ADMIN_VIEWER' && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${e.name}?`)) return;
                            try {
                              const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
                              const res = await fetch(`/api/employees/${e.id}`, {
                                method: "DELETE",
                                headers: { ...(token ? { ...(token ? { Authorization: `Bearer ${token}` } : {}) } : {}) },
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setData(data.filter((emp) => emp.id !== e.id));
                            } catch (err) {
                              alert("Failed to delete: " + (err as any).message);
                            }
                          }}
                          className="text-slate-500 hover:text-red-400 transition-colors text-[10px] font-bold uppercase tracking-widest"
                        >
                          Delete
                        </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
