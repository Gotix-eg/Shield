"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";

export default function RegisterFirmPage() {
  const [form, setForm] = useState({ firmName: "", ownerName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register-firm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");
      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">✅</div>
          <h1 className="text-3xl font-serif text-white mb-4">Firm Registered!</h1>
          <p className="text-slate-400 mb-8">
            Your firm has been registered in <span className="text-amber-400 font-medium">Demo Mode</span>. 
            You can log in now and explore the platform. Contact us to upgrade to full access.
          </p>
          <Link href="/login"
            className="inline-block bg-legal-gold text-[#0a0f1a] font-bold px-8 py-3 rounded-xl hover:bg-legal-gold/90 transition-all">
            Go to Login →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1a] flex items-center justify-center p-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-serif text-legal-gold mb-2 tracking-tighter">SHIELD ADVOCATES</h1>
          <p className="text-slate-500 text-sm">Register your law firm — start with a free demo</p>
          <div className="h-px w-full bg-gradient-to-r from-transparent via-legal-gold/30 to-transparent mt-6" />
        </div>

        {/* Demo badge */}
        <div className="flex items-center gap-3 bg-amber-400/5 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          <span className="text-xl">🎯</span>
          <p className="text-amber-400/80 text-xs">
            New firms start in <strong>Demo Mode</strong> (3 users). Contact us after registration to unlock full access.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-4 bg-red-500/10 border-l-4 border-red-500 rounded">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {[
            { key: "firmName", label: "Law Firm Name", placeholder: "e.g. Ahmed & Partners Law Firm", type: "text" },
            { key: "ownerName", label: "Admin Full Name", placeholder: "Your full name", type: "text" },
            { key: "email", label: "Admin Email", placeholder: "admin@yourfirm.com", type: "email" },
            { key: "password", label: "Password", placeholder: "Min. 8 characters", type: "password" },
          ].map(f => (
            <div key={f.key} className="group">
              <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 font-bold">
                {f.label}
              </label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                required
                className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-xl text-white text-sm focus:outline-none focus:border-legal-gold/50 focus:bg-white/[0.07] transition-all"
              />
            </div>
          ))}

          <button type="submit" disabled={loading}
            className="w-full bg-legal-gold text-[#0a0f1a] font-bold py-4 rounded-xl hover:bg-legal-gold/90 transition-all disabled:opacity-50 mt-2">
            {loading ? "Creating your firm…" : "Register Firm →"}
          </button>
        </form>

        <p className="text-center text-slate-600 text-xs mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-slate-400 hover:text-legal-gold transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
