'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/fetchAuth';
import { Toaster } from 'react-hot-toast';
import Link from 'next/link';

interface Company {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
}

export default function DashboardHome() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetchAuth("/api/company");
        if (res.status === 404) {
          setCompany(null);
          return;
        }
        if (!res.ok) throw new Error("Failed to load company");
        const data = await res.json();
        setCompany(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, []);

  return (
    <div className="px-8 py-12 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <h1 className="text-5xl font-serif mb-4 text-legal-900 tracking-tight">
            Dashboard
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl font-light leading-relaxed">
            Welcome back. Here is a summary of your firm's current status and essential management tools.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-golden">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-golden">
            {loading ? (
              <div className="legal-card p-golden flex items-center justify-center min-h-[300px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-slate-100"></div>
                  <div className="h-4 w-48 bg-slate-100 rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="legal-card p-golden border-red-100 bg-red-50/30">
                <h3 className="text-red-900 font-serif text-xl mb-2">Notice</h3>
                <p className="text-red-700/80">{error}</p>
              </div>
            ) : company ? (
              <section className="legal-card p-golden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif text-legal-900">Firm Profile</h2>
                  <div className="h-px flex-1 mx-6 bg-slate-100"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold">Active</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 group-hover:text-legal-gold transition-colors">Firm Name</p>
                    <p className="text-lg text-legal-900 font-medium">{company.name}</p>
                  </div>
                  {company.email && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 group-hover:text-legal-gold transition-colors">Digital Contact</p>
                      <p className="text-lg text-legal-900 font-medium">{company.email}</p>
                    </div>
                  )}
                  {company.phone && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 group-hover:text-legal-gold transition-colors">Direct Line</p>
                      <p className="text-lg text-legal-900 font-medium">{company.phone}</p>
                    </div>
                  )}
                  {company.address && (
                    <div className="md:col-span-2 group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 group-hover:text-legal-gold transition-colors">Physical Address</p>
                      <p className="text-lg text-legal-900 font-medium leading-snug">{company.address}</p>
                    </div>
                  )}
                </div>
              </section>
            ) : (
              <div className="legal-card p-golden text-center py-16">
                <p className="text-slate-400 font-light italic">No firm data established. Please initialize in settings.</p>
              </div>
            )}

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link href="/clients/new" className="legal-card p-8 group hover:border-legal-gold/30 transition-all">
                <h3 className="text-xl font-serif mb-2 text-legal-900 group-hover:text-legal-gold transition-colors">New Client</h3>
                <p className="text-sm text-slate-500 font-light">Onboard a new client into the system.</p>
              </Link>
              <Link href="/invoices" className="legal-card p-8 group hover:border-legal-gold/30 transition-all">
                <h3 className="text-xl font-serif mb-2 text-legal-900 group-hover:text-legal-gold transition-colors">Billing</h3>
                <p className="text-sm text-slate-500 font-light">Review pending invoices and payments.</p>
              </Link>
            </div>
          </div>

          {/* Sidebar / Stats */}
          <aside className="space-y-golden">
            <div className="legal-card p-golden bg-legal-900 text-white border-none shadow-2xl">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Quick Overview</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-white/60 text-sm font-light">Recent Projects</span>
                  <span className="text-3xl font-serif text-white">12</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-white/60 text-sm font-light">Pending Tasks</span>
                  <span className="text-3xl font-serif text-white">08</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-white/60 text-sm font-light">Unpaid Invoices</span>
                  <span className="text-3xl font-serif text-legal-gold">04</span>
                </div>
              </div>
            </div>

            <div className="legal-card p-golden border-dashed border-2 border-slate-200 bg-transparent shadow-none hover:border-legal-gold/50 transition-all cursor-help">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-400 mb-4 font-bold">ProLaw Intelligence</h4>
              <p className="text-sm text-slate-600 leading-relaxed font-light italic">
                "Precision is the soul of justice."
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}