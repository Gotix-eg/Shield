"use client";

import React, { useState, useEffect } from "react";
import { getAuth } from "@/lib/auth";

interface Record {
  id: number;
  employeeId: number;
  employee: { name: string };
  clockIn: string;
  clockOut?: string;
}

export default function AttendancePage() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({ from: "", to: "" });
  const [nameFilter, setNameFilter] = useState("");
  const [empOptions, setEmpOptions] = useState<{ id: number; name: string }[]>(
    []
  );
  const [form, setForm] = useState({
    employeeId: "",
    clockIn: "",
    clockOut: "",
  });

  const token = getAuth();

  /* ---------- helpers ---------- */
  const fetchData = async () => {
    try {
      const url = `/api/attendance?from=${filter.from}&to=${filter.to}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setRecords(await res.json());
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  /* initial load */
  useEffect(() => {
    fetchData();
    fetch("/api/employees", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => r.json())
      .then((arr) =>
        setEmpOptions(arr.map((e: any) => ({ id: e.id, name: e.name })))
      )
      .catch(() => {});
  }, []);

  const hoursDiff = (start: string, end?: string) => {
    if (!end) return "—";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return (diffMs / 36e5).toFixed(2);
  };

  const totalHours = records.reduce((sum, r) => {
    if (r.clockOut) {
      return sum + (new Date(r.clockOut).getTime() - new Date(r.clockIn).getTime()) / 36e5;
    }
    return sum;
  }, 0);

  const filteredRecords = records.filter((r) =>
    !nameFilter
      ? true
      : r.employee.name.toLowerCase().includes(nameFilter.toLowerCase())
  );

  /* -------------------------------- */

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Attendance</h1>
            <p className="text-slate-400 font-light max-w-xl">Monitor employee clock-in/out times and calculate total working hours.</p>
          </div>
          <div className="flex gap-3">
            <input
              type="text"
              value={nameFilter}
              onChange={(e) => setNameFilter(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors w-64"
              placeholder="Filter by employee name..."
            />
            <div className="flex gap-2">
              <input
                type="date"
                value={filter.from}
                onChange={(e) => setFilter({ ...filter, from: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
              />
              <input
                type="date"
                value={filter.to}
                onChange={(e) => setFilter({ ...filter, to: e.target.value })}
                className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:border-legal-gold/50 transition-colors"
              />
              <button onClick={fetchData} className="btn-legal-outline px-4">Apply</button>
            </div>
          </div>
        </div>
      </header>

      {/* action buttons */}
      <div className="flex gap-4 mb-8">
        <button
          onClick={async () => {
            try {
              const q = `from=${filter.from}&to=${filter.to}`;
              const res = await fetch(`/api/attendance/export?${q}` , {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              if (!res.ok) {
                alert(await res.text());
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "attendance.csv";
              document.body.appendChild(a);
              a.click();
              a.remove();
              window.URL.revokeObjectURL(url);
            } catch (e) {
              console.error(e);
              alert("Failed to export CSV");
            }
          }}
          className="btn-legal px-6"
        >
          Export CSV
        </button>
        <label className="btn-legal-outline px-6 cursor-pointer">
          Import CSV
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const fd = new FormData();
              fd.append("file", file);
              const res = await fetch("/api/attendance/import", {
                method: "POST",
                body: fd,
              });
              if (res.ok) {
                alert("Imported");
                fetchData();
              } else {
                alert(await res.text());
              }
              e.target.value = "";
            }}
          />
        </label>
        <div className="ml-auto flex flex-col items-end justify-center">
          <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Total Working Hours</span>
          <span className="text-2xl font-serif text-legal-gold">{totalHours.toFixed(2)} hrs</span>
        </div>
      </div>

      {/* manual add form */}
      <div className="legal-card p-8 mb-12">
        <h3 className="text-xl font-serif text-white mb-8">Manual Entry</h3>
        <div className="flex flex-wrap items-end gap-6">
          <div className="space-y-2 flex-1 min-w-[200px]">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Employee</label>
            <select
              value={form.employeeId}
              onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              <option value="" className="bg-slate-900">Select Employee…</option>
              {empOptions.map((o) => (
                <option key={o.id} value={o.id} className="bg-slate-900">
                  {o.name} (#{o.id})
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Clock In</label>
            <input
              type="datetime-local"
              value={form.clockIn}
              onChange={(e) => setForm({ ...form, clockIn: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Clock Out</label>
            <input
              type="datetime-local"
              value={form.clockOut}
              onChange={(e) => setForm({ ...form, clockOut: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            />
          </div>
          <button
            onClick={async () => {
              if (!form.employeeId || !form.clockIn) {
                alert("Select employee and clock in");
                return;
              }
              const body = {
                employeeId: Number(form.employeeId),
                clockIn: new Date(form.clockIn).toISOString(),
                ...(form.clockOut
                  ? { clockOut: new Date(form.clockOut).toISOString() }
                  : {}),
              };
              const res = await fetch("/api/attendance", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: JSON.stringify(body),
              });
              if (res.ok) {
                setForm({ employeeId: "", clockIn: "", clockOut: "" });
                fetchData();
              } else {
                alert(await res.text());
              }
            }}
            className="btn-legal px-8 h-[42px]"
          >
            Save Record
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 mb-4">{error}</p>}

      {/* table */}
      <div className="legal-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5 border-b border-white/5">
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Employee</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Clock In</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Clock Out</th>
                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-right">Hours</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={4} className="px-8 py-16 text-center text-slate-500 italic font-light">Loading attendance records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr><td colSpan={4} className="px-8 py-16 text-center text-slate-500 italic font-light">No attendance records found.</td></tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="group hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6 text-slate-200 font-medium">{r.employee.name}</td>
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(r.clockIn).toLocaleString()}</td>
                    <td className="px-8 py-6 text-slate-400 font-mono text-xs">
                      {r.clockOut ? new Date(r.clockOut).toLocaleString() : "—"}
                    </td>
                    <td className="px-8 py-6 text-right font-bold text-legal-gold">
                      {hoursDiff(r.clockIn, r.clockOut)}
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