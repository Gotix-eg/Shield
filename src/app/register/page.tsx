"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Registration failed");

      router.push("/login");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="dashboard-container flex min-h-screen items-center justify-center p-4">
      <div className="legal-card w-full max-w-md p-8">
        <header className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Register</h1>
          <p className="text-slate-400 font-light">Create your law firm account to get started</p>
        </header>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold">Company Name</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-500 focus:border-legal-gold/50 transition-all outline-none"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold">Your Name</label>
            <input
              type="text"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-500 focus:border-legal-gold/50 transition-all outline-none"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold">Email Address</label>
            <input
              type="email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-500 focus:border-legal-gold/50 transition-all outline-none"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-[0.3em] text-legal-gold font-bold">Password</label>
            <input
              type="password"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-6 py-4 text-white placeholder:text-slate-500 focus:border-legal-gold/50 transition-all outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              required
            />
          </div>
          
          {error && (
            <div className="legal-card p-4 border-red-500/20 bg-red-500/5">
              <p className="text-red-400 text-sm font-light">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            className="btn-legal w-full py-4 text-lg font-semibold disabled:opacity-50 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>
        
        <footer className="mt-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
          <p className="text-slate-400 font-light">
            Already have an account?{" "}
            <a 
              href="/login" 
              className="text-legal-gold hover:text-legal-gold/80 transition-colors font-medium"
            >
              Sign In
            </a>
          </p>
        </footer>
      </div>
    </main>
  );
}
