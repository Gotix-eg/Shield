"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getAuth } from "@/lib/auth";
import { createClient } from "@/lib/api";

export default function NewClientPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    contactEmail: "",
    phone: "",
    vatCode: "",
    city: "",
    country: "",
  });

  useEffect(() => {
    const token = getAuth();
    if (!token) router.push("/login");
  }, [router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await createClient(formData);
      router.push("/clients");
    } catch (err: any) {
      console.error("Error creating client:", err);
      setError("Failed to create client. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-4xl font-serif text-white tracking-tight mb-1">Add New Client</h1>
            <p className="text-slate-400 font-light text-sm">Fill in the client details below to create a new record.</p>
          </div>
          <button
            onClick={() => router.push("/clients")}
            className="text-slate-500 hover:text-legal-gold text-sm font-medium tracking-widest uppercase transition-colors"
          >
            ← Back
          </button>
        </div>

        {error && (
          <div className="legal-card p-4 border-red-500/20 bg-red-500/5 mb-6">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="legal-card p-8">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Name */}
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                Client Name <span className="text-legal-gold">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="e.g. Norton Rose Fulbright"
                required
                className="w-full rounded-lg px-4 py-3"
              />
            </div>

            {/* Email */}
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                Contact Email
              </label>
              <input
                type="email"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="contact@company.com"
                className="w-full rounded-lg px-4 py-3"
              />
            </div>

            {/* Phone */}
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+20 10 1234 5678"
                className="w-full rounded-lg px-4 py-3"
              />
            </div>

            {/* VAT ID + City in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="group">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                  VAT ID / Tax Number
                </label>
                <input
                  type="text"
                  name="vatCode"
                  value={formData.vatCode}
                  onChange={handleChange}
                  placeholder="e.g. EG123456789"
                  className="w-full rounded-lg px-4 py-3"
                />
              </div>

              <div className="group">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Cairo"
                  className="w-full rounded-lg px-4 py-3"
                />
              </div>
            </div>

            {/* Country */}
            <div className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">
                Country
              </label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleChange}
                placeholder="e.g. Egypt"
                className="w-full rounded-lg px-4 py-3"
              />
            </div>

            {/* Divider */}
            <div className="h-px w-full bg-white/5 my-2"></div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-legal py-4 text-base rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <span className="w-4 h-4 border-2 border-legal-900/30 border-t-legal-900 rounded-full animate-spin"></span>
                  Creating…
                </span>
              ) : (
                "Create Client →"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}