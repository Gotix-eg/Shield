"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth } from "@/lib/auth";

export default function NewEmployeePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    department: "",
    email: "",
    hireDate: "",
    status: "ACTIVE",
    salaryAmount: "",
    salaryCurrency: "USD",
    leaveBalanceDays: "",
    positionId: "",
    role: "LAWYER",
    password: "",
    projectIds: [] as number[],
    lawyerIds: [] as number[],
  });

  const [positions, setPositions] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: number; name: string }[]>([]);

  React.useEffect(() => {
    fetch("/api/positions")
      .then((r) => r.json())
      .then((d) => setPositions(d));
    fetch("/api/projects", { headers: { Authorization: `Bearer ${getAuth()}` } })
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setProjects(d):setProjects([]));
    fetch("/api/lawyers", { headers: { Authorization: `Bearer ${getAuth()}` } })
      .then(r=>r.json())
      .then(d=>Array.isArray(d)?setLawyers(d):setLawyers([]));
  }, []);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if(name==='leaveBalanceDays'){
      setForm({...form, leaveBalanceDays:value});
    }else if(name === 'projectIds' || name==='lawyerIds'){
      const options = Array.from((e.target as HTMLSelectElement).selectedOptions).map(o=>Number(o.value));
      setForm(prev=>({ ...prev, [name]: options }));
    }else{
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = getAuth();
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...form, leaveBalanceDays: form.leaveBalanceDays? Number(form.leaveBalanceDays): undefined }),
      });
      if (!res.ok) throw new Error(await res.text());
      window.location.href = "/admin/employees";
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container max-w-xl p-8">
      <h1 className="mb-6 text-3xl font-bold">Add Employee</h1>
      {error && <p className="mb-4 text-red-600">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block">Name*</label>
          <input
            className="w-full rounded border px-3 py-2"
            name="name"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block">Email*</label>
          <input
            type="email"
            className="w-full rounded border px-3 py-2"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block">Department</label>
          <input
            className="w-full rounded border px-3 py-2"
            name="department"
            value={form.department}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block">Hire Date</label>
          <input
            type="date"
            className="w-full rounded border px-3 py-2"
            name="hireDate"
            value={form.hireDate}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="block">Status</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            name="status"
            value={form.status}
            onChange={handleChange}
          >
            <option value="ACTIVE" className="bg-slate-900">ACTIVE</option>
            <option value="INACTIVE" className="bg-slate-900">INACTIVE</option>
            <option value="TERMINATED" className="bg-slate-900">TERMINATED</option>
          </select>
        </div>
        <div>
          <label className="block">Salary Amount*</label>
          <input
            type="number"
            step="0.01"
            className="w-full rounded border px-3 py-2"
            name="salaryAmount"
            value={form.salaryAmount}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label className="block">Leave Balance (days)</label>
          <input type="number" step="0.1" name="leaveBalanceDays" value={form.leaveBalanceDays} onChange={handleChange} className="w-full rounded border px-3 py-2" />
        </div>
        <div>
          <label className="block">Currency</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            name="salaryCurrency"
            value={form.salaryCurrency}
            onChange={handleChange}
          >
            {[
              "USD",
              "EUR",
              "SAR",
              "EGP",
              "AED",
              "QAR",
              "KWD",
              "OMR",
              "JPY",
              "CNY",
              "INR",
            ].map((c) => (
              <option key={c} value={c} className="bg-slate-900">
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block">Position</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            name="positionId"
            value={form.positionId}
            onChange={handleChange}
          >
            <option value="" className="bg-slate-900">-- Select Position --</option>
            {positions.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900">
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block">Role</label>
          <select
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            {[
              "LAWYER",
              "LAWYER_MANAGER",
              "LAWYER_PARTNER",
              "MANAGING_PARTNER",
              "ACCOUNTANT_MASTER",
              "ACCOUNTANT_ASSISTANT",
              "HR_MANAGER",
              "HR",
              "ADMIN_REPORTS",
            ].map((r) => (
              <option key={r} value={r} className="bg-slate-900">
                {r}
              </option>
            ))}
          </select>
        </div>
        {(form.role === 'LAWYER_MANAGER' || form.role === 'LAWYER_PARTNER') && (
          <>
            <div>
              <label className="block font-medium text-white">Managed Projects</label>
              <details className="rounded-lg border border-white/10 bg-white/5 p-3 mb-2">
                <summary className="cursor-pointer select-none text-sm text-slate-300">
                  {form.projectIds.length ? `${form.projectIds.length} selected` : 'Choose projects'}
                </summary>
                <div className="max-h-40 overflow-y-auto mt-3 space-y-2 text-sm custom-scrollbar pr-2">
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.projectIds.includes(p.id)}
                        onChange={e => {
                          const next = e.target.checked ? [...form.projectIds, p.id] : form.projectIds.filter(id => id !== p.id);
                          setForm(prev => ({ ...prev, projectIds: next }));
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all"
                      />
                      <span className="text-slate-200">{p.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
            <div>
              <label className="block font-medium text-white">Managed Lawyers</label>
              <details className="rounded-lg border border-white/10 bg-white/5 p-3">
                <summary className="cursor-pointer select-none text-sm text-slate-300">
                  {form.lawyerIds.length ? `${form.lawyerIds.length} selected` : 'Choose lawyers'}
                </summary>
                <div className="max-h-40 overflow-y-auto mt-3 space-y-2 text-sm custom-scrollbar pr-2">
                  {lawyers.map(l => (
                    <label key={l.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={form.lawyerIds.includes(l.id)}
                        onChange={e => {
                          const next = e.target.checked ? [...form.lawyerIds, l.id] : form.lawyerIds.filter(id => id !== l.id);
                          setForm(prev => ({ ...prev, lawyerIds: next }));
                        }}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 checked:bg-legal-gold checked:border-legal-gold transition-all"
                      />
                      <span className="text-slate-200">{l.name}</span>
                    </label>
                  ))}
                </div>
              </details>
            </div>
          </>
        )}
        <div>
          <label className="block">Password</label>
          <input
            type="password"
            className="w-full rounded border px-3 py-2"
            name="password"
            value={form.password}
            onChange={handleChange}
          />
        </div>
        <button
          disabled={loading}
          className="rounded bg-legal-gold px-4 py-2 text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save"}
        </button>
      </form>
    </div>
  );
}
