/*
  Simple Login page recreated after backup loss.
  Shows email & password inputs and posts to /api/login.
*/
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // store token if provided
      if (data.token) {
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; Path=/; SameSite=Lax`;
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-legal-900">
      {/* Visual Side */}
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-24">
        <div className="absolute inset-0 bg-gradient-to-br from-legal-900 via-legal-800 to-black opacity-90"></div>
        <div 
          className="absolute inset-0 opacity-30 bg-cover bg-center mix-blend-overlay scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop')" }}
        ></div>
        
        <div className="relative z-10 max-w-lg">
          <span className="text-legal-gold text-[10px] uppercase tracking-[0.5em] font-bold mb-8 block animate-in fade-in slide-in-from-left-8 duration-1000">INTELLIGENT LEGAL MANAGEMENT</span>
          <h2 className="text-6xl font-serif text-white mb-8 leading-tight animate-in fade-in slide-in-from-left-12 duration-1000 delay-200">
            Elevate Your <br /> 
            <span className="italic text-legal-gold">Legal Practice.</span>
          </h2>
          <div className="h-px w-24 bg-legal-gold/50 mb-8"></div>
          <p className="text-slate-400 font-light leading-relaxed text-lg animate-in fade-in slide-in-from-left-16 duration-1000 delay-500">
            Pro Law is a comprehensive ecosystem built for the modern law firm. Manage cases, track billable hours, automate complex accounting, and handle HR operations—all within a single, secure, and intuitive interface designed for professional excellence.
          </p>
        </div>
        
        {/* Subtle Decorative Elements */}
        <div className="absolute bottom-12 left-12 flex gap-4 opacity-20">
          <div className="w-12 h-[1px] bg-white"></div>
          <div className="w-4 h-[1px] bg-white"></div>
        </div>
      </div>

      {/* Form Side */}
      <div className="flex items-center justify-center p-8 bg-legal-900 lg:bg-background relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-legal-gold/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          <header className="mb-12">
            <h1 className="text-5xl font-serif text-legal-gold mb-4 tracking-tighter">PRO LAW</h1>
            <p className="text-slate-400 font-light leading-relaxed mb-8">
              The ultimate legal practice management solution. Streamline your firm's operations, automate billing, and manage client relationships with unmatched precision and security.
            </p>
            <div className="h-[1px] w-full bg-gradient-to-r from-legal-gold/50 to-transparent mb-8"></div>
            <h2 className="text-xl font-serif text-legal-900 lg:text-legal-900 text-white mb-2">Member Login</h2>
            <p className="text-slate-500 font-light text-sm text-slate-400">Please enter your secure credentials.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border-l-2 border-red-500 animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 lg:border-slate-200 py-3 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-white lg:text-legal-900 placeholder:text-slate-600"
                  placeholder="name@firm.com"
                />
              </div>
              
              <div className="group">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">Security Password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-b border-slate-700 lg:border-slate-200 py-3 px-0 rounded-none focus:border-legal-gold transition-all outline-none text-white lg:text-legal-900 placeholder:text-slate-600"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-legal-gold text-legal-900 py-4 rounded-sm font-serif font-bold tracking-[0.2em] hover:bg-white hover:text-legal-900 transition-all duration-500 disabled:opacity-50 shadow-xl shadow-legal-gold/10 group flex items-center justify-center gap-3"
              >
                <span>{loading ? "VERIFYING..." : "AUTHENTICATE"}</span>
                {!loading && <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>}
              </button>
            </div>
            
            <footer className="text-center pt-12">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-500 font-bold">
                Authorized Personnel Only
                <br />
                <span className="mt-4 block opacity-50 italic font-serif normal-case tracking-normal text-xs">"Justice through precision."</span>
              </p>
            </footer>
          </form>
        </div>
      </div>
    </div>
  );
}
