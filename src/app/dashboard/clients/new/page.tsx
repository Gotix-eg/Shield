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
    contactPerson: "",
    contactEmail: "",
    phone: "",
    vatCode: "",
    city: "",
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
    <main className="dashboard-container min-h-screen py-10 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-serif text-white tracking-tight mb-2">Add New Client</h1>
            <p className="text-slate-400 font-light">Enter the client details to onboard them into the system.</p>
          </div>
          <button
            onClick={() => router.push("/clients")}
            className="text-slate-400 hover:text-legal-gold transition-colors text-sm uppercase tracking-widest font-bold"
          >
            ← Back
          </button>
        </div>

        <form onSubmit={handleSubmit} className="legal-card p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                Client Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                placeholder="e.g. Norton Rose Fulbright"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                placeholder="e.g. John Doe"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  placeholder="email@example.com"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  City
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  placeholder="e.g. Cairo"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                  Country
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                  placeholder="e.g. Egypt"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-legal-gold font-bold mb-2">
                VAT ID / Tax Code
              </label>
              <input
                type="text"
                value={formData.vatCode}
                onChange={(e) => setFormData({ ...formData, vatCode: e.target.value })}
                className="w-full rounded px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-legal-gold"
                placeholder="Tax Identification Number"
              />
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-legal w-full text-center py-3 text-sm tracking-wider flex justify-center items-center"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#0a0f1a]"></span>
                    Creating...
                  </span>
                ) : (
                  "Create Client"
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}