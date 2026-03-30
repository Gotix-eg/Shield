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
  const [currentRole, setCurrentRole] = useState<string | null>(null);

  useEffect(() => {
    const tokenLocal = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (tokenLocal) {
      try { setCurrentRole(JSON.parse(atob(tokenLocal.split(".")[1])).role); } catch {}
    }
    const fetchData = async () => {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        const res = await fetch("/api/employees", {
          headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
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
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-serif text-white tracking-tight mb-2">Employees</h1>
          <p className="text-slate-400 font-light">Manage your firm&apos;s workforce and HR records.</p>
        </header>

        {loading && (
          <div className="legal-card p-8 flex items-center justify-center">
            <div className="animate-pulse text-slate-400 font-light">Loading employees…</div>
          </div>
        )}
        {error && (
          <div className="legal-card p-4 border-red-500/20 bg-red-500/5 mb-4">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Action Buttons */}
        {currentRole !== "ADMIN_VIEWER" && (
          <div className="mb-6 flex gap-3">
            <Link
              href="/admin/employees/new"
              className="btn-legal"
            >
              + Add Employee
            </Link>
            <button
              onClick={() => {
                const rows = [
                  ["ID", "Name", "Email", "Department", "Status", "Role", "Leave Balance", "Salary", "Currency"]
                ].concat(
                  data.map(e => {
                    const latest = e.salaries[0];
                    return [e.id, e.name, e.email ?? "", e.department ?? "", e.status, e.user?.role ?? "", e.leaveBalanceDays ?? 0, latest ? latest.amount : "", latest ? latest.currency : ""];
                  })
                );
                const csv = rows.map(r => r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(",")).join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = "employees.csv"; a.click(); URL.revokeObjectURL(url);
              }}
              className="btn-legal-outline"
            >
              Export CSV
            </button>
          </div>
        )}

        {/* Table */}
        <div className="legal-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">ID</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Name</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Email</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Department</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Status</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Role</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Leave Balance</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Latest Salary</th>
                <th className="px-6 py-4 text-left text-[10px] uppercase tracking-widest text-legal-gold font-bold whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((e) => {
                const latest = e.salaries[0];
                return (
                  <tr key={e.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs whitespace-nowrap">{e.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {currentRole === "ADMIN_VIEWER" ? (
                        <span className="text-white">{e.name}</span>
                      ) : (
                        <Link className="text-legal-gold hover:text-yellow-300 transition-colors" href={`/admin/employees/${e.id}`}>{e.name}</Link>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">{e.email || "—"}</td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">{e.department || "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                        e.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap text-xs">{e.user?.role ?? "—"}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentRole === "ADMIN_VIEWER" ? (
                        <span className="text-slate-300">{e.leaveBalanceDays ?? 0}</span>
                      ) : (
                        <input
                          type="number"
                          className="w-20 rounded px-2 py-1 text-sm text-center"
                          defaultValue={e.leaveBalanceDays ?? 0}
                          onBlur={async (ev) => {
                            const val = Number((ev.target as HTMLInputElement).value);
                            if (isNaN(val)) return;
                            try {
                              const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                              const res = await fetch(`/api/employees/${e.id}/balance`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                                body: JSON.stringify({ leaveBalanceDays: val }),
                              });
                              if (!res.ok) throw new Error(await res.text());
                            } catch {
                              alert("Failed to update balance");
                            }
                          }}
                        />
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-300 whitespace-nowrap">
                      {latest ? `${latest.amount} ${latest.currency}` : "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {currentRole !== "ADMIN_VIEWER" && (
                        <button
                          onClick={async () => {
                            if (!confirm(`Delete ${e.name}?`)) return;
                            try {
                              const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
                              const res = await fetch(`/api/employees/${e.id}`, {
                                method: "DELETE",
                                headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
                              });
                              if (!res.ok) throw new Error(await res.text());
                              setData(data.filter((emp) => emp.id !== e.id));
                            } catch (err) {
                              alert("Failed to delete: " + (err as any).message);
                            }
                          }}
                          className="px-3 py-1.5 rounded text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/25 transition-all"
                        >
                          Delete
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
