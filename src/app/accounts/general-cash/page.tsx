'use client';

import Link from 'next/link';

export default function CashLedgersPage() {
  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Cash Ledgers</h1>
        <p className="text-slate-400 font-light max-w-xl">Monitor physical cash flows, office income, and project-based expense deductions.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Link
          href="/accounts/income-cash"
          className="legal-card p-10 group hover:border-legal-gold/30 transition-all duration-500 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-2xl font-serif text-white group-hover:text-legal-gold transition-colors mb-4">Income Cash Ledger</h2>
            <p className="text-slate-500 font-light leading-relaxed">Detailed record of all physical cash receipts and office-level income movements.</p>
          </div>
          <div className="mt-8 flex items-center justify-end">
            <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold group-hover:translate-x-2 transition-transform">View Ledger →</span>
          </div>
        </Link>

        <Link
          href="/accounts/expense-cash"
          className="legal-card p-10 group hover:border-legal-gold/30 transition-all duration-500 flex flex-col justify-between"
        >
          <div>
            <h2 className="text-2xl font-serif text-white group-hover:text-legal-gold transition-colors mb-4">Project Expense Cash</h2>
            <p className="text-slate-500 font-light leading-relaxed">Tracking of client advance payments and cash deductions for specific project costs.</p>
          </div>
          <div className="mt-8 flex items-center justify-end">
            <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold group-hover:translate-x-2 transition-transform">View Records →</span>
          </div>
        </Link>
      </div>
    </div>
  );
}
