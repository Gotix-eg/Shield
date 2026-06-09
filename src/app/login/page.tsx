/*
  Login page with Google reCAPTCHA v2 protection.
*/
"use client";

import { useState, useRef, FormEvent } from "react";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const RECAPTCHA_SITE_KEY = "6Lccl6EsAAAAACMYKaSIEpzKQFabtzHeg_7hg7To";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const captchaToken = recaptchaRef.current?.getValue();
    if (!captchaToken) {
      setError("Please complete the CAPTCHA verification.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, captchaToken }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // store token if provided
      if (data.token) {
        localStorage.setItem("token", data.token);
        document.cookie = `token=${data.token}; Path=/; SameSite=Lax`;
      }

      // force hard navigation so NavBar and layout pick up the new token
      window.location.href = "/dashboard";
    } catch (err: any) {
      setError(err.message || "Login failed");
      recaptchaRef.current?.reset();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-[#0a0f1a]">
      {/* Visual Side (Left) */}
      <div className="hidden lg:flex relative overflow-hidden items-center justify-center p-24">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0f1a] via-[#111827] to-black opacity-95"></div>
        <div 
          className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay scale-110"
          style={{ backgroundImage: "url('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=2070&auto=format&fit=crop')" }}
        ></div>
        
        <div className="relative z-10 max-w-lg">
          <span className="text-legal-gold text-[12px] uppercase tracking-[0.5em] font-bold mb-8 block animate-in fade-in slide-in-from-left-8 duration-1000">INTELLIGENT LEGAL MANAGEMENT SYSTEM</span>
          <h2 className="text-7xl font-serif text-white mb-8 leading-tight animate-in fade-in slide-in-from-left-12 duration-1000 delay-200">
            SHIELD ADVOCATES <br /> 
            <span className="italic text-legal-gold text-5xl">for professional excellence.</span>
          </h2>
          <div className="h-px w-24 bg-legal-gold/50 mb-8"></div>
          <p className="text-slate-400 font-light leading-relaxed text-xl animate-in fade-in slide-in-from-left-16 duration-1000 delay-500">
            A sophisticated system designed specifically for modern law firms. Manage cases, track billable hours, automate complex accounting, and handle HR operations—all within a single, secure, and intuitive interface.
          </p>
        </div>
      </div>

      {/* Form Side (Right) */}
      <div className="flex items-center justify-center p-8 bg-[#0a0f1a] lg:bg-transparent relative overflow-hidden">
        {/* Decorative background shape */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-legal-gold/5 rounded-full blur-3xl"></div>
        
        <div className="w-full max-w-md relative z-10">
          <header className="mb-12">
            <h1 className="text-6xl font-serif text-legal-gold mb-4 tracking-tighter">SHIELD ADVOCATES</h1>
            <p className="text-slate-400 font-light leading-relaxed mb-8 text-lg">
              The ultimate solution for managing your legal practice. Streamline firm operations, automate billing, and manage client relationships with unmatched precision and security.
            </p>
            <div className="h-[1px] w-full bg-gradient-to-r from-legal-gold/50 to-transparent mb-12"></div>
            <h2 className="text-2xl font-serif text-white mb-2">Member Login</h2>
            <p className="text-slate-500 font-light text-sm">Please enter your secure credentials.</p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-8">
            {error && (
              <div className="p-4 bg-red-500/10 border-l-4 border-red-500 animate-in fade-in zoom-in duration-300">
                <p className="text-sm text-red-400 font-medium">{error}</p>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="group">
                <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 mb-2 group-focus-within:text-legal-gold transition-colors font-bold">Corporate Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-white focus:outline-none focus:border-legal-gold/50 focus:bg-white/[0.07] transition-all duration-300"
                  placeholder="name@firm.com"
                  required
                />
              </div>

              <div className="group">
                <div className="flex justify-between items-center mb-2 px-1">
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-slate-500 group-focus-within:text-legal-gold transition-colors font-bold">Security Password</label>
                  <a href="#" className="text-[10px] uppercase tracking-widest text-slate-600 hover:text-legal-gold transition-colors">Forgot Password?</a>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 px-6 py-4 rounded-xl text-white focus:outline-none focus:border-legal-gold/50 focus:bg-white/[0.07] transition-all duration-300"
                  placeholder="••••••••"
                  required
                />
              </div>

              </div>

            {/* reCAPTCHA */}
              <div className="flex justify-center py-2">
                <ReCAPTCHA
                  ref={recaptchaRef}
                  sitekey={RECAPTCHA_SITE_KEY}
                  theme="dark"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-legal py-5 rounded-xl text-lg relative overflow-hidden group shadow-2xl"
              >
                <span className="relative z-10 flex items-center justify-center gap-3">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-legal-900/30 border-t-legal-900 rounded-full animate-spin"></div>
                  ) : (
                    <>Enter Platform <span className="text-xl">→</span></>
                  )}
                </span>
              </button>
            </form>

          <footer className="mt-12 pt-8 border-t border-white/5 text-center">
            <p className="text-slate-600 text-xs font-light tracking-widest uppercase">
              &copy; {new Date().getFullYear()} SHIELD ADVOCATES. ALL RIGHTS RESERVED.
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
}
