"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuth } from "@/lib/auth";
import { createClient } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    address: "",
    city: "",
    vatCode: "",
    country: "",
  });

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const token = getAuth();
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createClient(formData);
      router.push("/clients");
    } catch (error) {
      console.error("Error creating client:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Add New Client</h1>
            <p className="text-slate-400 font-light max-w-xl">Register a new client entity to the firm directory.</p>
          </div>
          <button
            onClick={() => router.push("/clients")}
            className="btn-legal-outline px-6"
          >
            Back to Directory
          </button>
        </div>
      </header>

      <div className="legal-card p-10 max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Client Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                required
                placeholder="Full Name / Company Name"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Contact Email
              </label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                required
                placeholder="client@example.com"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                required
                placeholder="+00 000 000 000"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                VAT Number
              </label>
              <input
                type="text"
                value={formData.vatCode}
                onChange={(e) => setFormData({ ...formData, vatCode: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                placeholder="VAT / Tax ID"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                Country
              </label>
              <input
                type="text"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                placeholder="e.g. United Kingdom"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                placeholder="City Name"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              Full Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors h-24 resize-none"
              placeholder="Full mailing address..."
            />
          </div>

          <div className="pt-6">
            <button
              type="submit"
              disabled={loading}
              className="btn-legal w-full py-4 text-sm disabled:opacity-50"
            >
              {loading ? "Registering Client..." : "Create Client"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}