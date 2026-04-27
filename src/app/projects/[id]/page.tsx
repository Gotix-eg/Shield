"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";

interface Payment {
  id: number;
  amount: number;
  currency: string;
  bank?: { id: number; name: string } | null;
  paidOn: string;
  notes: string | null;
  accountType: "TRUST" | "EXPENSE";
}

interface Attachment {
  id: number;
  url: string;
  type: string;
  createdAt: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = Number(params?.id);
  if (Number.isNaN(projectId))
    return <div className="p-6 text-red-600">Invalid project ID</div>;

  const router = useRouter();
  const token = getAuth();

  /* state */
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attType, setAttType] = useState<
    "POWER_OF_ATTORNEY" | "CONTRACT" | "OTHER"
  >("OTHER");
  const [attLabel, setAttLabel] = useState("");
  const [attFiles, setAttFiles] = useState<FileList | null>(null);

  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [notes, setNotes] = useState("");
  const [bankId, setBankId] = useState<number | "">("");
  const { data: banks } = useSWR("/api/banks", (url: string) =>
    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    }).then((r) => r.json())
  );
  const [accountType, setAccountType] = useState<"TRUST" | "EXPENSE">("TRUST");
  const [editId, setEditId] = useState<number | null>(null);
  const [project, setProject] = useState<any>(null);

  /* ---------- helpers ---------- */
  const fetchProject = async () => {
    try {
      const res = await fetch(`/api/projects/${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) setProject(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch(`/api/advance-payments?projectId=${projectId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (!res.ok) throw new Error();
      setPayments(await res.json());
    } catch {
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttachments = async () => {
    try {
      const res = await fetch(
        `/api/projects/${projectId}/attachments`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      if (res.ok) setAttachments(await res.json());
    } catch (e) {
      console.error(e);
    }
  };

  const uploadAttachments = async () => {
    if (!attFiles || attFiles.length === 0) return;
    const fd = new FormData();
    Array.from(attFiles).forEach((f) => fd.append("files", f));
    fd.append("type", attType);
    if (attLabel.trim()) fd.append("label", attLabel.trim());
    const res = await fetch(
      `/api/projects/${projectId}/attachments`,
      {
        method: "POST",
        body: fd,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      }
    );
    if (res.ok) {
      toast.success("Uploaded");
      setAttFiles(null);
      setAttLabel("");
      fetchAttachments();
    } else toast.error("Upload failed");
  };


  const submitPayment = async () => {
    if (!amount) return;
    try {
      const endpoint = editId
        ? `/api/advance-payments/${editId}`
        : `/api/advance-payments`;
      const method = editId ? "PUT" : "POST";
      const res = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          projectId,
          amount: parseFloat(amount),
          currency,
          accountType,
          notes: notes.trim() || null,
          bankId: bankId || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success(editId ? "Payment updated" : "Payment added");
      setAmount("");
      setNotes("");
      setEditId(null);
      fetchPayments();
    } catch {
      toast.error("Add failed");
    }
  };
  /* -------------------------------- */

  useEffect(() => {
    fetchProject();
    fetchPayments();
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Toaster />
      <h1 className="text-2xl font-bold mb-4">Advance Payments & Details</h1>
      <p className="mb-6 text-sm text-gray-600">Project ID: {projectId} {project && `| Name: ${project.name}`}</p>

      {/* Retainer Dashboard Widget */}
      {project && project.billingType && project.billingType.includes("RETAINER") && (
        <div className="bg-white p-6 rounded-lg border border-legal-gold/30 shadow-sm mb-8">
          <h2 className="font-semibold text-lg mb-4 text-legal-gold uppercase tracking-wider flex items-center gap-2">
            <span>Retainer Status</span>
            <span className="text-xs bg-legal-gold/10 text-legal-gold px-2 py-1 rounded-full">
              {project.billingType.replace("_", " ")}
            </span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Fee</p>
              <p className="font-semibold text-lg">{project.retainerFee} <span className="text-sm font-normal text-gray-400">{project.billingCurrency}</span></p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Total Hours</p>
              <p className="font-semibold text-lg">{project.retainerHours} <span className="text-sm font-normal text-gray-400">hrs</span></p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Used</p>
              <p className="font-semibold text-lg text-blue-600">{project.usedHours?.toFixed(2) || 0} <span className="text-sm font-normal text-gray-400">hrs</span></p>
            </div>
            <div className="bg-gray-50 p-3 rounded border border-gray-100">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overtime Rate</p>
              <p className="font-semibold text-lg text-rose-600">
                {project.billingType === "CAPPED_RETAINER" ? project.overtimeRate : project.hourlyRate} 
                <span className="text-sm font-normal text-gray-400"> {project.billingCurrency}/hr</span>
              </p>
            </div>
          </div>

          <div className="mb-2 flex justify-between text-sm">
            <span className="font-medium text-gray-700">Hours Usage</span>
            <span className={`font-bold ${project.usedHours > project.retainerHours ? 'text-rose-600' : 'text-emerald-600'}`}>
              {project.usedHours?.toFixed(1) || 0} / {project.retainerHours}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
            <div 
              className={`h-2.5 rounded-full ${project.usedHours > project.retainerHours ? 'bg-rose-500' : 'bg-emerald-500'}`} 
              style={{ width: `${Math.min((project.usedHours / project.retainerHours) * 100, 100)}%` }}
            ></div>
          </div>
          {project.usedHours > project.retainerHours && (
            <p className="mt-3 text-sm text-rose-600 flex items-center gap-1 font-medium bg-rose-50 p-2 rounded">
              ⚠️ Warning: Retainer exceeded by {(project.usedHours - project.retainerHours).toFixed(2)} hours. Additional billing will apply.
            </p>
          )}
        </div>
      )}


      {/* Add Payment */}
      <div className="bg-gray-50 p-4 rounded border mb-8">
        <h2 className="font-semibold mb-2">Add Payment</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <input
            type="number"
            step="0.01"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="border px-2 py-1 rounded w-32"
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="border px-1 py-1 rounded"
          >
            {[
              "USD",
              "EUR",
              "GBP",
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
              <option key={c}>{c}</option>
            ))}
          </select>
          {/* type */}
          <div className="flex items-center gap-2 text-sm">
            {["TRUST", "EXPENSE"].map((t) => (
              <label key={t} className="flex items-center gap-1">
                <input
                  type="radio"
                  name="acctType"
                  value={t}
                  checked={accountType === t}
                  onChange={() => setAccountType(t as any)}
                />
                {t[0] + t.slice(1).toLowerCase()}
              </label>
            ))}
          </div>
          <select
            value={bankId}
            onChange={(e) =>
              setBankId(e.target.value ? Number(e.target.value) : "")
            }
            className="border px-1 py-1 rounded"
          >
            <option value="">
              {Array.isArray(banks) ? "Select Bank" : "Loading banks..."}
            </option>
            {Array.isArray(banks) &&
              banks
                .filter((b: any) => b.currency === currency)
                .map((b: any) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
          </select>
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="border px-2 py-1 rounded flex-1"
          />
          <button
            onClick={submitPayment}
            disabled={!amount || !bankId}
            className="bg-blue-600 text-white rounded px-4 py-1 hover:bg-blue-700 disabled:opacity-50"
          >
            Add
          </button>
        </div>
      </div>

      {/* Attachments */}
      <div className="bg-gray-50 p-4 rounded border mb-8">
        <h2 className="font-semibold mb-3">Project Attachments</h2>
        <div className="flex flex-wrap items-center gap-3 mb-3">
          <select
            value={attType}
            onChange={(e) => setAttType(e.target.value as any)}
            className="border px-2 py-1 rounded"
          >
            <option value="POWER_OF_ATTORNEY">Power of Attorney</option>
            <option value="CONTRACT">Contract</option>
            <option value="OTHER">Other</option>
          </select>
          <input
            type="text"
            value={attLabel}
            onChange={(e) => setAttLabel(e.target.value)}
            placeholder="File name / label (optional)"
            className="border px-2 py-1 rounded flex-1 min-w-[180px]"
          />
          <input
            type="file"
            multiple
            onChange={(e) => setAttFiles(e.target.files)}
            className="border px-2 py-1"
          />
          <button
            onClick={uploadAttachments}
            disabled={!attFiles || attFiles.length === 0}
            className="bg-blue-600 text-white px-4 py-1 rounded disabled:opacity-50"
          >
            Upload
          </button>
        </div>

        {attachments.length === 0 ? (
          <p className="text-sm text-gray-600">No attachments yet.</p>
        ) : (
          <table className="text-sm border min-w-full">
            <thead className="bg-gray-100">
              <tr>
                {["Type / Label", "Uploaded", "File", " "].map((h) => (
                  <th key={h} className="border px-2 py-1">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {attachments.map((a) => (
                <tr key={a.id}>
                  <td className="border px-2 py-1">
                    {(a as any).label || a.type.replace(/_/g, ' ')}
                  </td>
                  <td className="border px-2 py-1">
                    {new Date(a.createdAt).toLocaleDateString()}
                  </td>
                  <td className="border px-2 py-1">
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener"
                      className="text-blue-600 underline"
                    >
                      View
                    </a>
                  </td>
                  <td className="border px-2 py-1 text-right">
                    <button
                      onClick={async () => {
                        if (!confirm("Delete file?")) return;
                        const res = await fetch(
                          `/api/project-attachments/${a.id}`,
                          {
                            method: "DELETE",
                            headers: token
                              ? { Authorization: `Bearer ${token}` }
                              : {},
                          }
                        );
                        if (res.ok) {
                          toast.success("Deleted");
                          fetchAttachments();
                        } else toast.error("Delete failed");
                      }}
                      className="text-red-600 underline text-xs"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payments table */}
      {loading ? (
        <p>Loading…</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                {["Date", "Amount", "Type", "Bank", "Notes", "Actions"].map(
                  (h) => (
                    <th
                      key={h}
                      className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase ${
                        h === "Actions" ? "text-right" : "text-left"
                      }`}
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(p.paidOn).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {p.amount} {p.currency}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.accountType === "TRUST" ? "Trust" : "Expense"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.bank?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {p.notes || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-right">
                    {/* actions: Edit / Delete كما كانت إذا احتجتها */}
                  </td>
                </tr>
              ))}
              {payments.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="text-center py-4 text-sm text-gray-500"
                  >
                    No payments yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-600">
        <Link href="/projects" className="text-blue-600 underline">
          ← Back to Projects
        </Link>
      </p>
    </div>
  );
}