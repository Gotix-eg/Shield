"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import Link from "next/link";
import { fetchAuth } from "@/lib/fetchAuth";

interface Row {
  batchId: number;
  period: string;
  status: string;
  employeeId: number;
  employeeName: string;
  grossSalary: number;
  totalDeductions: number;
  netSalary: number;
  createdAt: string;
}

export default function SalariesReportPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string>(dayjs().startOf("year").format("YYYY-MM-DD"));
  const [to, setTo] = useState<string>(dayjs().format("YYYY-MM-DD"));

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ from, to }).toString();
    const res = await fetchAuth(`/api/reports/salaries?${qs}`);
    if (res.ok) {
      setRows(await res.json());
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = rows.reduce((acc, r) => {
    acc.totalGross += r.grossSalary;
    acc.totalNet += r.netSalary;
    return acc;
  }, { totalGross: 0, totalNet: 0 });

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Salary Report</h1>
            <p className="text-slate-400 font-light max-w-xl">Detailed analysis of payroll, gross earnings, and net distributions.</p>
          </div>
          <Link href="/admin/reports" className="btn-legal-outline">Back to Reports</Link>
        </div>
      </header>

      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Filter Records</h3>
        <div className="flex flex-wrap gap-6 items-end">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">From Date</label>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">To Date</label>
            <input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors" 
            />
          </div>
          <button onClick={load} className="btn-legal px-8 h-[42px]">Search Records</button>
        </div>
      </div>

      <div className="legal-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500 italic font-light">Loading report data...</div>
        ) : rows.length === 0 ? (
          <div className="p-16 text-center text-slate-500 italic font-light">No salary records found for this period.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Period</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Employee</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Gross</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Net</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {rows.map((r, idx) => (
                  <tr key={`${r.batchId}-${r.employeeId}-${idx}`} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{dayjs(r.createdAt).format("YYYY-MM-DD")}</td>
                    <td className="px-8 py-6 text-slate-300 font-medium">{r.period}</td>
                    <td className="px-8 py-6 text-slate-200">{r.employeeName}</td>
                    <td className="px-8 py-6 text-right font-mono text-xs text-slate-400">{r.grossSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-6 text-right font-bold text-legal-gold">{r.netSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td className="px-8 py-6 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                        r.status === 'PAID' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-white/5">
                <tr className="font-bold">
                  <td colSpan={3} className="px-8 py-6 text-right text-slate-400 text-xs uppercase tracking-widest">Grand Totals</td>
                  <td className="px-8 py-6 text-right text-slate-200 font-mono">{totals.totalGross.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td className="px-8 py-6 text-right text-legal-gold text-lg font-serif">{totals.totalNet.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
