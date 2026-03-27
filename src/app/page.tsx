"use client";

import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-legal-900 text-white selection:bg-legal-gold/30 overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 px-8 overflow-hidden">
        {/* Background Visuals */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(197,160,89,0.05)_0%,transparent_70%)]"></div>
          <div 
            className="absolute inset-0 opacity-20 bg-cover bg-center mix-blend-overlay scale-105"
            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1505664194779-8beaceb93744?q=80&w=2070&auto=format&fit=crop')" }}
          ></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto text-center animate-in fade-in slide-in-from-bottom-12 duration-1000">
          <span className="text-legal-gold text-[10px] uppercase tracking-[0.6em] font-bold mb-6 block">PROFESSIONAL LEGAL ECOSYSTEM</span>
          <h1 className="text-6xl md:text-8xl font-serif mb-8 leading-tight tracking-tighter">
            PRO <span className="italic text-legal-gold font-light">LAW</span>
          </h1>
          <div className="h-px w-32 bg-legal-gold/50 mx-auto mb-8"></div>
          <p className="text-xl md:text-2xl text-slate-400 font-light leading-relaxed max-w-3xl mx-auto mb-12">
            The ultimate management suite designed for excellence. Orchestrate your firm's success with integrated case management, sophisticated billing, and advanced HR analytics.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link
              href="/login"
              className="px-12 py-4 bg-legal-gold text-legal-900 font-serif font-bold tracking-[0.2em] hover:bg-white hover:text-legal-900 transition-all duration-500 shadow-2xl shadow-legal-gold/10 group flex items-center justify-center gap-3"
            >
              MEMBER ACCESS <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link
              href="/register"
              className="px-12 py-4 border border-white/20 text-white font-serif font-bold tracking-[0.2em] hover:bg-white hover:text-legal-900 transition-all duration-500 flex items-center justify-center"
            >
              FIRM REGISTRATION
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 opacity-30 animate-bounce">
          <span className="text-[10px] uppercase tracking-widest vertical-rl">EXPLORE</span>
          <div className="w-[1px] h-12 bg-white"></div>
        </div>
      </section>

      {/* Value Props Section */}
      <section className="py-32 px-8 bg-background relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
            <div className="space-y-6">
              <span className="text-legal-gold font-serif italic text-4xl">01.</span>
              <h3 className="text-2xl font-serif text-legal-900">Case Intelligence</h3>
              <p className="text-slate-500 font-light leading-relaxed">
                Centralize every detail. Manage clients, projects, and tasks with granular control and intelligent assignment workflows.
              </p>
            </div>
            <div className="space-y-6">
              <span className="text-legal-gold font-serif italic text-4xl">02.</span>
              <h3 className="text-2xl font-serif text-legal-900">Precision Billing</h3>
              <p className="text-slate-500 font-light leading-relaxed">
                Automate your revenue cycle. Multi-currency invoicing, trust accounting, and expense tracking designed for transparency.
              </p>
            </div>
            <div className="space-y-6">
              <span className="text-legal-gold font-serif italic text-4xl">03.</span>
              <h3 className="text-2xl font-serif text-legal-900">Operational Security</h3>
              <p className="text-slate-500 font-light leading-relaxed">
                Your data is your legacy. Benefit from advanced multi-tenant isolation and enterprise-grade authentication protocols.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Branding */}
      <footer className="py-12 px-8 border-t border-white/5 bg-legal-900 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-slate-500 font-bold">
          PRO LAW GLOBAL © 2026 — EXCELLENCE IN LEGAL OPERATIONS
        </p>
      </footer>
    </div>
  );
}