"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";
import Link from "next/link";
import { getAuth } from "@/lib/auth";
import useSWR from "swr";

interface Client { id: number; name: string; }
interface Bank   { id: number; name: string; currency: string; }

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
  
  // Assignee Type
  const [assigneeType, setAssigneeType] = useState("LAWYER");
  const [agentFees, setAgentFees] = useState("");
  const [agentCurrency, setAgentCurrency] = useState("USD");
  const [clientWillPay, setClientWillPay] = useState(false);
  const [officePercentage, setOfficePercentage] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | "">("");
  const [selectedLawyerId, setSelectedLawyerId] = useState<number | "">("");

  // Billing
  const [billingType, setBillingType] = useState<"HOURS" | "FIXED">("HOURS");
  const [rateSource, setRateSource] = useState<"LAWYER" | "PROJECT">("LAWYER");
  const [hourlyRate, setHourlyRate] = useState("");
  const [fixedFee, setFixedFee] = useState("");
  const [billingCurrency, setBillingCurrency] = useState("USD");

  // Advance payments (set at create time)
  const [trustAmount,   setTrustAmount]   = useState("");
  const [trustCurrency, setTrustCurrency] = useState("USD");
  const [trustNotes,    setTrustNotes]    = useState("");
  const [trustBankId,   setTrustBankId]   = useState<number | "">("");

  const [expenseAmount,   setExpenseAmount]   = useState("");
  const [expenseCurrency, setExpenseCurrency] = useState("USD");
  const [expenseNotes,    setExpenseNotes]    = useState("");
  const [expenseBankId,   setExpenseBankId]   = useState<number | "">("");

  // fetch banks list
  const { data: banks = [] } = useSWR<Bank[]>("/api/banks", (url: string) =>
    fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} }).then(r => r.json())
  );

  // fetch agents and lawyers
  const [agents, setAgents] = useState<{id: number; name: string}[]>([]);
  const [lawyers, setLawyers] = useState<{id: number; name: string}[]>([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/agents", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch("/api/list/lawyers", { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
    ]).then(([a, l]) => {
      setAgents(Array.isArray(a) ? a : []);
      setLawyers(Array.isArray(l) ? l : []);
    });
  }, []);

  // Files to attach to the project
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, string>>({});

  const addFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    const valid = selected.filter(f => allowed.includes(f.type));
    if (valid.length < selected.length) toast.error('Only PDF, Word, Excel files are allowed');
    setPendingFiles(prev => [...prev, ...valid]);
    e.target.value = '';
  };

  const removeFile = (idx: number) =>
    setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const fileIcon = (mime: string) => {
    if (mime === 'application/pdf') return '📄';
    if (mime.includes('word')) return '📝';
    if (mime.includes('excel') || mime.includes('spreadsheet')) return '📊';
    return '📎';
  };

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

    // Validate assignee selection
    if ((assigneeType === "LAWYER" || assigneeType === "BOTH") && !selectedLawyerId) {
      toast.error("Please select a lawyer");
      return;
    }
    if ((assigneeType === "AGENT" || assigneeType === "BOTH") && !selectedAgentId) {
      toast.error("Please select an agent");
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
          assigneeType,
          agentFees: agentFees ? parseFloat(agentFees) : null,
          agentCurrency,
          clientWillPay,
          officePercentage: officePercentage ? parseFloat(officePercentage) : null,
          agentId: selectedAgentId ? Number(selectedAgentId) : null,
          lawyerId: selectedLawyerId ? Number(selectedLawyerId) : null,
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
            bankId: trustBankId || null,
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
            bankId: expenseBankId || null,
          }),
        });
      }

      // 4. Upload attached files
      if (pendingFiles.length > 0) {
        for (const file of pendingFiles) {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));
          const fd = new FormData();
          fd.append('file', file);
          fd.append('projectId', String(projectId));
          const upRes = await fetch('/api/upload/document', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: fd,
          });
          if (upRes.ok) {
            setUploadProgress(prev => ({ ...prev, [file.name]: 'done' }));
          } else {
            toast.error(`Failed to upload ${file.name}`);
          }
        }
      }

      toast.success('Project created successfully');
      router.push('/projects');
    } catch (err) {
      console.error(err);
      toast.error('Failed to create project');
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

            {/* Assignee Type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Handled By
                </label>
                <select
                  value={assigneeType}
                  onChange={(e) => { setAssigneeType(e.target.value); setSelectedAgentId(""); setSelectedLawyerId(""); }}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                >
                  <option value="LAWYER">Lawyer</option>
                  <option value="AGENT">Agent</option>
                  <option value="BOTH">Both</option>
                </select>
              </div>

              {/* Show Agent dropdown when Agent or Both */}
              {(assigneeType === "AGENT" || assigneeType === "BOTH") && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Select Agent
                  </label>
                  <select
                    value={selectedAgentId}
                    onChange={(e) => setSelectedAgentId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    <option value="">Select Agent</option>
                    {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}

              {/* Show Lawyer dropdown when Lawyer or Both */}
              {(assigneeType === "LAWYER" || assigneeType === "BOTH") && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Select Lawyer
                  </label>
                  <select
                    value={selectedLawyerId}
                    onChange={(e) => setSelectedLawyerId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    <option value="">Select Lawyer</option>
                    {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                  </select>
                </div>
              )}
            </div>

            {(assigneeType === "AGENT" || assigneeType === "BOTH") && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Agent Fees
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={agentFees}
                    onChange={(e) => setAgentFees(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Currency
                  </label>
                  <select
                    value={agentCurrency}
                    onChange={(e) => setAgentCurrency(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  >
                    {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            )}

            {/* Client Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="clientWillPay"
                  checked={clientWillPay}
                  onChange={(e) => setClientWillPay(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="clientWillPay" className="text-sm text-slate-300">
                  Client will pay directly
                </label>
              </div>

              {clientWillPay && (
                <div>
                  <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                    Office Percentage
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={officePercentage}
                    onChange={(e) => setOfficePercentage(e.target.value)}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                    placeholder="e.g. 20"
                  />
                </div>
              )}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Bank Account</label>
                  <select
                    value={trustBankId}
                    onChange={(e) => setTrustBankId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/50"
                  >
                    <option value="">No bank (manual)</option>
                    {Array.isArray(banks) && banks
                      .filter((b: Bank) => !trustCurrency || b.currency === trustCurrency)
                      .map((b: Bank) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
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
                  <label className="block text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">Bank Account</label>
                  <select
                    value={expenseBankId}
                    onChange={(e) => setExpenseBankId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400/50"
                  >
                    <option value="">No bank (manual)</option>
                    {Array.isArray(banks) && banks
                      .filter((b: Bank) => !expenseCurrency || b.currency === expenseCurrency)
                      .map((b: Bank) => <option key={b.id} value={b.id}>{b.name} ({b.currency})</option>)}
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

          {/* ─── Documents Card ─── */}
          <div className="legal-card p-8 space-y-5">
            <h2 className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold border-b border-white/5 pb-3">
              Attachments (Optional)
            </h2>
            <p className="text-xs text-slate-500">Attach PDF, Word (.doc/.docx), or Excel (.xls/.xlsx) files — Agreement, data sheets, etc.</p>

            {/* Drop zone / picker */}
            <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-white/10 rounded-lg py-8 cursor-pointer hover:border-legal-gold/30 transition-colors">
              <span className="text-3xl">📎</span>
              <span className="text-sm text-slate-400">Click to choose files</span>
              <span className="text-[10px] text-slate-600 uppercase tracking-widest">PDF · Word · Excel</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                className="hidden"
                onChange={addFiles}
              />
            </label>

            {/* File list */}
            {pendingFiles.length > 0 && (
              <ul className="space-y-2">
                {pendingFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between rounded px-4 py-2 bg-white/5 border border-white/5">
                    <span className="flex items-center gap-2 text-sm text-slate-300">
                      <span>{fileIcon(f.type)}</span>
                      <span className="truncate max-w-xs">{f.name}</span>
                      <span className="text-[10px] text-slate-600">{(f.size / 1024).toFixed(0)} KB</span>
                    </span>
                    {uploadProgress[f.name] === 'uploading' && (
                      <span className="text-[10px] text-amber-400 animate-pulse">Uploading…</span>
                    )}
                    {uploadProgress[f.name] === 'done' && (
                      <span className="text-[10px] text-emerald-400">✓ Done</span>
                    )}
                    {!uploadProgress[f.name] && (
                      <button type="button" onClick={() => removeFile(i)}
                        className="text-slate-500 hover:text-red-400 transition-colors text-sm leading-none">✕</button>
                    )}
                  </li>
                ))}
              </ul>
            )}
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
