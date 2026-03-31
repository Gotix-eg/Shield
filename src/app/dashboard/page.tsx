'use client';

import { useEffect, useState } from 'react';
import { fetchAuth } from '@/lib/fetchAuth';
import Link from 'next/link';

interface Company {
  name: string;
  address?: string;
  email?: string;
  phone?: string;
  status: "DEMO" | "ACTIVE" | "SUSPENDED";
  maxSeats: number;
  subscriptionEnds: string | null;
  _count?: { users: number };
}

export default function DashboardHome() {
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ projects: number; pendingTasks: number; unpaidInvoices: number }>({
    projects: 0,
    pendingTasks: 0,
    unpaidInvoices: 0,
  });

  useEffect(() => {
    const fetchCompany = async () => {
      try {
        const res = await fetchAuth("/api/company");
        if (res.status === 404) { setCompany(null); return; }
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

    const fetchStats = async () => {
      try {
        const [projectsRes, tasksRes, invoicesRes] = await Promise.all([
          fetchAuth('/api/projects'),
          fetchAuth('/api/tasks'),
          fetchAuth('/api/invoices'),
        ]);
        const [projects, tasks, invoices] = await Promise.all([
          projectsRes.ok ? projectsRes.json() : [],
          tasksRes.ok ? tasksRes.json() : [],
          invoicesRes.ok ? invoicesRes.json() : [],
        ]);
        const pendingTasks = Array.isArray(tasks)
          ? tasks.filter((t: any) => t?.status && String(t.status).toUpperCase() !== 'DONE').length : 0;
        const unpaidInvoices = Array.isArray(invoices)
          ? invoices.filter((inv: any) => inv?.status && String(inv.status).toUpperCase() !== 'PAID').length : 0;
        setStats({ projects: Array.isArray(projects) ? projects.length : 0, pendingTasks, unpaidInvoices });
      } catch {
        setStats({ projects: 0, pendingTasks: 0, unpaidInvoices: 0 });
      } finally {
        setStatsLoading(false);
      }
    };

    fetchCompany();
    fetchStats();
  }, []);

  const fmt2 = (n: number) => String(Math.max(0, n)).padStart(2, '0');

  return (
    <div className="dashboard-container">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-serif mb-4 text-white tracking-tight">Dashboard</h1>
          <p className="text-lg text-slate-400 max-w-2xl font-light leading-relaxed">
            Welcome back. Here is a summary of your firm&apos;s current status and essential management tools.
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-golden">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-golden">
            {loading ? (
              <div className="legal-card p-golden flex items-center justify-center min-h-[300px]">
                <div className="animate-pulse flex flex-col items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-white/5"></div>
                  <div className="h-4 w-48 bg-white/5 rounded"></div>
                </div>
              </div>
            ) : error ? (
              <div className="legal-card p-golden">
                <h3 className="text-red-400 font-serif text-xl mb-2">Notice</h3>
                <p className="text-red-300/70">{error}</p>
              </div>
            ) : company ? (
              <section className="legal-card p-golden">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-serif text-white">Firm Profile</h2>
                  <div className="h-px flex-1 mx-6 bg-white/5"></div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold">Active</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="group">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">Firm Name</p>
                    <p className="text-lg text-white font-medium">{company.name}</p>
                  </div>
                  {company.email && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">Email</p>
                      <p className="text-lg text-white font-medium">{company.email}</p>
                    </div>
                  )}
                  {company.phone && (
                    <div className="group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">Direct Line</p>
                      <p className="text-lg text-white font-medium">{company.phone}</p>
                    </div>
                  )}
                  {company.address && (
                    <div className="md:col-span-2 group">
                      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">Physical Address</p>
                      <p className="text-lg text-white font-medium leading-snug">{company.address}</p>
                    </div>
                  )}

                  {/* ────────────────── Subscription Details ────────────────── */}
                  <div className="md:col-span-2 border-t border-white/10 my-2"></div>
                  
                  <div className="group">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">Subscription Details</p>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                        company.status === "ACTIVE" ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" :
                        company.status === "DEMO" ? "text-amber-400 bg-amber-400/10 border-amber-400/20" :
                        "text-red-400 bg-red-400/10 border-red-400/20"
                      }`}>
                        {company.status}
                      </span>
                      <span className="text-sm text-slate-400">
                        {company.subscriptionEnds 
                          ? `Renews on ${new Date(company.subscriptionEnds).toLocaleDateString()}` 
                          : "No Expiry Date"}
                      </span>
                    </div>
                  </div>

                  <div className="group">
                    <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1 group-hover:text-legal-gold transition-colors">System Users (Seats)</p>
                    <p className={`text-lg font-mono font-medium ${
                      (company._count?.users || 0) >= company.maxSeats ? "text-red-400" : "text-white"
                    }`}>
                      {company._count?.users || 0} / {company.maxSeats} {" "}
                      <span className="text-sm text-slate-500 font-sans tracking-normal">Active</span>
                    </p>
                  </div>
                </div>
              </section>
            ) : (
              <div className="legal-card p-golden text-center py-16">
                <p className="text-slate-400 font-light italic">No firm data established. Please initialize in settings.</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Link href="/clients/new" className="legal-card p-8 group hover:border-legal-gold/30 transition-all">
                <h3 className="text-xl font-serif mb-2 text-white group-hover:text-legal-gold transition-colors">New Client</h3>
                <p className="text-sm text-slate-500 font-light">Onboard a new client into the system.</p>
              </Link>
              <Link href="/invoices" className="legal-card p-8 group hover:border-legal-gold/30 transition-all">
                <h3 className="text-xl font-serif mb-2 text-white group-hover:text-legal-gold transition-colors">Billing</h3>
                <p className="text-sm text-slate-500 font-light">Review pending invoices and payments.</p>
              </Link>
            </div>
          </div>

          {/* Stats Sidebar */}
          <aside className="space-y-golden">
            <div className="legal-card p-golden">
              <h3 className="text-legal-gold text-[10px] uppercase tracking-[0.3em] font-bold mb-6">Quick Overview</h3>
              <div className="space-y-8">
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-white/60 text-sm font-light">Active Projects</span>
                  <span className="text-3xl font-serif text-white">{statsLoading ? '—' : fmt2(stats.projects)}</span>
                </div>
                <div className="flex justify-between items-end border-b border-white/10 pb-4">
                  <span className="text-white/60 text-sm font-light">Pending Tasks</span>
                  <span className="text-3xl font-serif text-white">{statsLoading ? '—' : fmt2(stats.pendingTasks)}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-white/60 text-sm font-light">Unpaid Invoices</span>
                  <span className="text-3xl font-serif text-legal-gold">{statsLoading ? '—' : fmt2(stats.unpaidInvoices)}</span>
                </div>
              </div>
            </div>
            <div className="legal-card p-golden border-dashed border-2 border-white/5 bg-transparent shadow-none hover:border-legal-gold/50 transition-all">
              <h4 className="text-[10px] uppercase tracking-widest text-slate-500 mb-4 font-bold">ProLaw</h4>
              <p className="text-sm text-slate-400 leading-relaxed font-light italic">&ldquo;Precision is the soul of justice.&rdquo;</p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}