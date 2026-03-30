"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { getAuth } from "@/lib/auth";

interface Client {
  id: number;
  name: string;
}

const CURRENCIES = ["USD", "EUR", "GBP", "SAR", "EGP", "AED", "QAR", "KWD", "OMR", "JPY", "CNY", "INR"];

export default function NewProjectPage() {
  const router = useRouter();
  const token = getAuth();

  const [clients, setClients] = useState<Client[]>([]);
  const [loadingClients, setLoadingClients] = useState(true);

  // Project fields
  const [name, setName] = useState("");
  const [clientId, setClientId] = useState<number | "">("");
  const [status, setStatus] = useState("OPEN");

  // Billing
  const [billingType, setBillingType] = useState<"HOURS" | "FIXED">("HOURS");
  const [rateSource, setRateSource] = useState<"LAWYER" | "PROJECT">("LAWYER");
  const [hourlyRate, setHourlyRate] = useState("");
  const [fixedFee, setFixedFee] = useState("");
  const [billingCurrency, setBillingCurrency] = useState("USD");

  // Advance payments (set at create time)
  const [trustAmount, setTrustAmount] = useState("");
  const [trustCurrency, setTrustCurrency] = useState("USD");
  const [trustNotes, setTrustNotes] = useState("");

  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState("USD");
  const [expenseNotes, setExpenseNotes] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await fetch("/api/clients", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Failed to fetch clients");
        setClients(await res.json());
      } catch {
        toast.error("Failed to load clients");
      } finally {
        setLoadingClients(false);
      }
    };
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !clientId) {
      toast.error("Name and client are required");
      return;
    }

    try {
      // 1. Create the project
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          clientId: Number(clientId),
          status,
          billingType,
          rateSource: billingType === "HOURS" ? rateSource : null,
          hourlyRate: billingType === "HOURS" && rateSource === "PROJECT" && hourlyRate ? parseFloat(hourlyRate) : null,
          fixedFee: billingType === "FIXED" && fixedFee ? parseFloat(fixedFee) : null,
          billingCurrency:
            (billingType === "HOURS" && rateSource === "PROJECT") || billingType === "FIXED"
              ? billingCurrency
              : null,
        }),
      });
      if (!res.ok) throw new Error("Create failed");
      const project = await res.json();
      const projectId = project.id;

      // 2. Add Trust advance if provided
      if (trustAmount && parseFloat(trustAmount) > 0) {
        await fetch(`/api/advance-payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            amount: parseFloat(trustAmount),
            currency: trustCurrency,
            accountType: "TRUST",
            notes: trustNotes.trim() || null,
          }),
        });
      }

      // 3. Add Expense advance if provided
      if (expenseAmount && parseFloat(expenseAmount) > 0) {
        await fetch(`/api/advance-payments`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            projectId,
            amount: parseFloat(expenseAmount),
            currency: expenseCurrency,
            accountType: "EXPENSE",
            notes: expenseNotes.trim() || null,
          }),
        });
      }

      toast.success("Project created successfully");
      router.push("/projects");
    } catch (err) {
      console.error(err);
      toast.error("Failed to create project");
    }
  };

  return (
    <main className="dashboard-container min-h-screen py-10 px-4">
      <Toaster />
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-4xl font-serif text-white tracking-tight mb-2">New Project</h1>
            <p className="text-slate-400 font-light">Create a new case and set its advance payments.</p>
          </div>
          <Link
            href="/projects"
            className="text-slate-400 hover:text-legal-gold transition-colors text-sm uppercase tracking-widest font-bold"
          >
            ← Back
          </Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ─── Project Info Card ─── */}
          <div className="legal-card p-8 space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold border-b border-white/5 pb-3">
              Project Details
            </h2>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                Project Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                placeholder="e.g. Commercial Contract Dispute"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Client <span className="text-red-400">*</span>
                </label>
                {loadingClients ? (
                  <p className="text-slate-400 text-sm">Loading clients…</p>
                ) : (
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                    required
                  >
                    <option value="">Select client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                >
                  <option value="OPEN">Open</option>
                  <option value="CLOSED">Closed</option>
                </select>
              </div>
            </div>
          </div>

          {/* ─── Billing Card ─── */}
          <div className="legal-card p-8 space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold border-b border-white/5 pb-3">
              Billing Settings
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Billing Type
                </label>
                <select
                  value={billingType}
                  onChange={(e) => setBillingType(e.target.value as "HOURS" | "FIXED")}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                >
                  <option value="HOURS">By Hours</option>
                  <option value="FIXED">Fixed Fee</option>
                </select>
              </div>

              {billingType === "HOURS" && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Rate Source
                  </label>
                  <select
                    value={rateSource}
                    onChange={(e) => setRateSource(e.target.value as "LAWYER" | "PROJECT")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    <option value="LAWYER">Lawyer Default Rate</option>
                    <option value="PROJECT">Fixed Project Rate</option>
                  </select>
                </div>
              )}
            </div>

            {billingType === "HOURS" && rateSource === "PROJECT" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Currency
                  </label>
                  <select
                    value={billingCurrency}
                    onChange={(e) => setBillingCurrency(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {billingType === "FIXED" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Fixed Fee
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={fixedFee}
                    onChange={(e) => setFixedFee(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                    placeholder="0.00"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Currency
                  </label>
                  <select
                    value={billingCurrency}
                    onChange={(e) => setBillingCurrency(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* ─── Advance Payments Card ─── */}
          <div className="legal-card p-8 space-y-6">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold border-b border-white/5 pb-3">
              Advance Payments (Optional)
            </h2>

            {/* Trust / القضية */}
            <div className="rounded-lg border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <p className="text-sm font-semibold text-emerald-400 uppercase tracking-widest">
                  Case Advance (Trust)
                </p>
              </div>
              <p className="text-xs text-slate-500">أدفنس القضية — يُضاف إلى حساب الأمانة للمشروع</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={trustAmount}
                    onChange={(e) => setTrustAmount(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Currency</label>
                  <select
                    value={trustCurrency}
                    onChange={(e) => setTrustCurrency(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Notes</label>
                  <input
                    type="text"
                    value={trustNotes}
                    onChange={(e) => setTrustNotes(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                    placeholder="Optional notes…"
                  />
                </div>
              </div>
            </div>

            {/* Expense / المصاريف */}
            <div className="rounded-lg border border-white/5 p-5 space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <p className="text-sm font-semibold text-amber-400 uppercase tracking-widest">
                  Expense Advance
                </p>
              </div>
              <p className="text-xs text-slate-500">أدفنس المصاريف — يُضاف إلى حساب المصروفات للمشروع</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1">
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Currency</label>
                  <select
                    value={expenseCurrency}
                    onChange={(e) => setExpenseCurrency(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  >
                    {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Notes</label>
                  <input
                    type="text"
                    value={expenseNotes}
                    onChange={(e) => setExpenseNotes(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                    placeholder="Optional notes…"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-4 pt-2">
            <button
              type="submit"
              className="btn-legal flex-1 py-3 text-sm tracking-wider text-center"
            >
              Create Project
            </button>
            <Link
              href="/projects"
              className="btn-legal-outline flex-1 py-3 text-sm tracking-wider text-center"
            >
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </main>
  );
}
