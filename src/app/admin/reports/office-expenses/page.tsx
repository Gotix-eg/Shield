"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { fetchAuth } from "@/lib/fetchAuth";
import Link from "next/link";

interface Item {
  id: number;
  date: string;
  memo: string | null;
  amount: number;
  currency: string;
  expenseAccount?: string;
  cashAccount?: string;
  cashAmount?: number;
  cashCurrency?: string;
}

export default function OfficeExpensesReport() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [from, setFrom] = useState<string>(dayjs().startOf("year").format("YYYY-MM-DD"));
  const [to, setTo] = useState<string>(dayjs().format("YYYY-MM-DD"));
  const [showSalaryDetails, setShowSalaryDetails] = useState(false);

  async function load() {
    setLoading(true);
    const qs = new URLSearchParams({ from, to }).toString();
    const res = await fetchAuth(`/api/reports/office-expenses?${qs}`);
    if (res.ok) setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totals = items.reduce((acc, it) => {
    const key = it.currency;
    acc[key] = (acc[key] || 0) + it.amount;
    return acc;
  }, {} as Record<string, number>);

  const officeRows = items.filter((it) => it.expenseAccount !== "Salary");
  const salaryRows = items.filter((it) => it.expenseAccount === "Salary");

  const salaryTotals = salaryRows.reduce((acc, it) => {
    const key = it.currency;
    acc[key] = (acc[key] || 0) + it.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Office Expenses Report</h1>
            <p className="text-slate-400 font-light max-w-xl">Comprehensive tracking of office operating costs and payroll distributions.</p>
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Date</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Account</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Memo</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Expense</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Paid From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {/* Office expenses rows */}
                {officeRows.map((it) => (
                  <tr key={`office-${it.id}`} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{dayjs(it.date).format("YYYY-MM-DD")}</td>
                    <td className="px-8 py-6 text-slate-200 font-medium">{it.expenseAccount}</td>
                    <td className="px-8 py-6 text-slate-400 font-light max-w-[300px] truncate">{it.memo ?? "-"}</td>
                    <td className="px-8 py-6 text-right font-bold text-legal-gold">{it.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-mono opacity-60 ml-1">{it.currency}</span></td>
                    <td className="px-8 py-6 text-right text-slate-400 font-mono text-xs">{it.cashAmount?.toLocaleString(undefined, { minimumFractionDigits: 2 })} {it.cashCurrency}</td>
                  </tr>
                ))}

                {/* Salary aggregated rows (one per currency) */}
                {Object.entries(salaryTotals).map(([cur, amt]) => (
                  <tr
                    key={`salary-summary-${cur}`}
                    className="group hover:bg-legal-gold/5 cursor-pointer bg-legal-gold/5 border-l-2 border-legal-gold transition-all"
                    onClick={() => setShowSalaryDetails((prev) => !prev)}
                  >
                    <td className="px-8 py-6 text-slate-500 font-mono text-xs">-</td>
                    <td className="px-8 py-6 font-serif text-white uppercase tracking-widest text-sm">Salary</td>
                    <td className="px-8 py-6 text-legal-gold/60 text-xs italic font-light">Click to view breakdown ↓</td>
                    <td className="px-8 py-6 text-right font-bold text-legal-gold">{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })} <span className="text-[10px] font-mono opacity-60 ml-1">{cur}</span></td>
                    <td className="px-8 py-6 text-right text-slate-500">-</td>
                  </tr>
                ))}

                {/* Salary detail rows, shown only when expanded */}
                {showSalaryDetails &&
                  salaryRows.map((it, idx) => (
                    <tr key={`salary-detail-${idx}`} className="bg-white/[0.02] border-l border-legal-gold/20 italic">
                      <td className="px-8 py-4 text-slate-500 font-mono text-[10px]">{dayjs(it.date).format("YYYY-MM-DD")}</td>
                      <td className="px-8 py-4 text-slate-400 text-xs">Salary Detail</td>
                      <td className="px-8 py-4 text-slate-500 text-xs max-w-[300px] truncate">{it.memo ?? "-"}</td>
                      <td className="px-8 py-4 text-right text-slate-400 text-xs">{it.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} {it.currency}</td>
                      <td className="px-8 py-4 text-right text-slate-500">-</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot className="bg-white/5">
                {Object.entries(totals).map(([cur, amt]) => (
                  <tr key={cur} className="font-bold border-t border-white/5">
                    <td colSpan={3} className="px-8 py-6 text-right text-slate-400 text-xs uppercase tracking-widest">Total {cur}</td>
                    <td className="px-8 py-6 text-right text-legal-gold text-lg font-serif">{amt.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td></td>
                  </tr>
                ))}
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
