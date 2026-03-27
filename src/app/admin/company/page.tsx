/* eslint-disable react-hooks/exhaustive-deps */
"use client";
import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";

interface Company {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  logoUrl?: string;
}

export default function CompanySettings() {
  const [company, setCompany] = useState<Company | null>(null);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const token = getAuth();

  useEffect(() => {
    fetch("/api/company", { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data: Company) => {
        setCompany(data);
        setForm({
          name: data.name ?? "",
          address: data.address ?? "",
          phone: data.phone ?? "",
        });
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    const fd = new FormData();
    fd.append("name", form.name);
    fd.append("address", form.address);
    fd.append("phone", form.phone);
    if (logoFile) fd.append("logo", logoFile);
    const res = await fetch("/api/company", {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    if (res.ok) {
      const updated = await res.json();
      setCompany(updated);
      alert("Saved successfully");
    } else {
      alert("Save failed");
    }
    setSaving(false);
  };

  if (!company) return <p className="p-8">Loading...</p>;

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Firm Identity</h1>
        <p className="text-slate-400 font-light max-w-xl">Maintain your firm's public profile, contact information, and professional branding assets.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2">
          <div className="legal-card p-10">
            <h3 className="text-xl font-serif text-white mb-8 border-b border-white/5 pb-6">General Information</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Firm Name</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    placeholder="e.g. ProLaw Global Partners"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Contact Number</label>
                  <input
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="+1 (000) 000-0000"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Physical Address</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors h-24 resize-none"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Street, Building, City, Country"
                />
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="btn-legal px-12 py-3 disabled:opacity-50"
                  disabled={saving}
                >
                  {saving ? "Processing..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="legal-card p-10 space-y-8">
            <h3 className="text-xl font-serif text-white border-b border-white/5 pb-6">Branding Asset</h3>
            <div className="flex flex-col items-center gap-8">
              <div className="relative group">
                <div className="w-48 h-48 rounded-2xl bg-white/5 border border-dashed border-white/10 flex items-center justify-center overflow-hidden transition-all duration-500 group-hover:border-legal-gold/30">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt="Firm Logo" className="w-full h-full object-contain p-4" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-600">
                      <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] uppercase tracking-widest font-bold">No Logo</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full space-y-4">
                <label className="btn-legal-outline w-full py-3 cursor-pointer text-[10px]">
                  {logoFile ? logoFile.name : "Select New Logo"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  />
                </label>
                <p className="text-[10px] text-slate-500 text-center font-light italic">Recommended: Square PNG/SVG with transparent background.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
