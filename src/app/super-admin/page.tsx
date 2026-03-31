"use client";

import { useState, useEffect } from "react";
import { getAuth } from "@/lib/auth";
import toast, { Toaster } from "react-hot-toast";
import { Building2, Users, CheckCircle, XCircle, Clock, Edit2, Shield, Trash2 } from "lucide-react";

interface Company {
  id: number;
  name: string;
  registeredEmail: string | null;
  status: "DEMO" | "ACTIVE" | "SUSPENDED";
  maxSeats: number;
  subscriptionEnds: string | null;
  _count: { users: number };
}

const STATUS_COLORS = {
  ACTIVE: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  DEMO: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  SUSPENDED: "text-red-400 bg-red-400/10 border-red-400/20",
};

export default function SuperAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ status: "", maxSeats: 3, subscriptionEnds: "" });
  const [saving, setSaving] = useState(false);

  const token = typeof window !== "undefined" ? getAuth() : null;
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/companies", { headers });
      if (!res.ok) throw new Error("Forbidden");
      setCompanies(await res.json());
    } catch { toast.error("Access denied"); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openEdit = (c: Company) => {
    setEditing(c);
    setForm({
      status: c.status,
      maxSeats: c.maxSeats,
      subscriptionEnds: c.subscriptionEnds ? c.subscriptionEnds.slice(0, 10) : "",
    });
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/super-admin/companies/${editing.id}`, {
        method: "PATCH", headers,
        body: JSON.stringify({
          status: form.status,
          maxSeats: Number(form.maxSeats),
          subscriptionEnds: form.subscriptionEnds || null,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Updated");
      setEditing(null);
      load();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (c: Company) => {
    if (c.registeredEmail === "info@pro-law.net") {
      toast.error("Cannot delete the master admin firm");
      return;
    }
    const confirmed = window.confirm(`DANGER: Are you sure you want to permanently delete '${c.name}' and ALL its associated data? This cannot be undone.`);
    if (!confirmed) return;

    try {
      const res = await fetch(`/api/super-admin/companies/${c.id}`, {
        method: "DELETE", headers,
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed");
      }
      toast.success("Firm deleted successfully");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete firm");
    }
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === "ACTIVE").length,
    demo: companies.filter(c => c.status === "DEMO").length,
    suspended: companies.filter(c => c.status === "SUSPENDED").length,
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a] p-8">
      <Toaster position="top-right" />

      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="p-3 rounded-xl bg-legal-gold/10 border border-legal-gold/20">
          <Shield className="w-6 h-6 text-legal-gold" />
        </div>
        <div>
          <h1 className="text-3xl font-serif text-white tracking-tight">Super Admin</h1>
          <p className="text-slate-500 text-sm mt-0.5">Platform Management Dashboard</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total Firms", value: stats.total, icon: Building2, color: "text-slate-300" },
          { label: "Active", value: stats.active, icon: CheckCircle, color: "text-emerald-400" },
          { label: "Demo", value: stats.demo, icon: Clock, color: "text-amber-400" },
          { label: "Suspended", value: stats.suspended, icon: XCircle, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="legal-card p-5 flex items-center gap-4">
            <s.icon className={`w-8 h-8 ${s.color} flex-shrink-0`} />
            <div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-slate-500 uppercase tracking-widest">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-slate-400 text-center py-16">Loading…</div>
      ) : (
        <div className="legal-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-[11px] uppercase tracking-widest text-slate-500">
                <th className="px-6 py-4 text-left">Firm</th>
                <th className="px-6 py-4 text-left">Email</th>
                <th className="px-6 py-4 text-left">Status</th>
                <th className="px-6 py-4 text-left">Users / Seats</th>
                <th className="px-6 py-4 text-left">Subscription Ends</th>
                <th className="px-6 py-4 text-left">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {companies.map(c => (
                <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{c.name}</td>
                  <td className="px-6 py-4 text-slate-400">{c.registeredEmail || "—"}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[c.status]}`}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`font-mono ${c._count.users >= c.maxSeats ? "text-red-400" : "text-slate-300"}`}>
                      {c._count.users} / {c.maxSeats}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {c.subscriptionEnds ? new Date(c.subscriptionEnds).toLocaleDateString() : <span className="text-slate-600 italic">No expiry</span>}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:border-legal-gold/30 hover:text-legal-gold text-slate-400 transition-all text-xs">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleDelete(c)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 hover:bg-red-500/20 hover:text-red-400 text-slate-500 transition-all text-xs">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="legal-card w-full max-w-md p-8 relative">
            <button onClick={() => setEditing(null)} className="absolute top-4 right-4 text-slate-500 hover:text-white text-lg">✕</button>
            <h2 className="text-xl font-serif text-white mb-1">{editing.name}</h2>
            <p className="text-slate-500 text-xs mb-6">Edit firm subscription settings</p>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">Status</label>
                <div className="flex gap-2">
                  {(["DEMO", "ACTIVE", "SUSPENDED"] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-bold border transition-all ${
                        form.status === s
                          ? s === "ACTIVE" ? "bg-emerald-400/20 border-emerald-400/40 text-emerald-400"
                            : s === "DEMO" ? "bg-amber-400/20 border-amber-400/40 text-amber-400"
                            : "bg-red-400/20 border-red-400/40 text-red-400"
                          : "bg-white/5 border-white/10 text-slate-500 hover:text-white"
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Max Users (Seats)
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setForm(f => ({ ...f, maxSeats: Math.max(1, f.maxSeats - 1) }))}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center text-lg">−</button>
                  <span className="text-2xl font-bold text-white w-12 text-center">{form.maxSeats}</span>
                  <button onClick={() => setForm(f => ({ ...f, maxSeats: f.maxSeats + 1 }))}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 flex items-center justify-center text-lg">+</button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Subscription Ends (leave empty = no expiry)
                </label>
                <input type="date" value={form.subscriptionEnds}
                  onChange={e => setForm(f => ({ ...f, subscriptionEnds: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:outline-none focus:border-legal-gold/50" />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(null)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-slate-400 hover:text-white transition-all text-sm">
                Cancel
              </button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-3 rounded-xl bg-legal-gold text-[#0a0f1a] font-bold text-sm hover:bg-legal-gold/90 transition-all disabled:opacity-50">
                {saving ? "Saving…" : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
