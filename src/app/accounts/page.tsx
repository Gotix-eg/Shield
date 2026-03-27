'use client';

import Link from 'next/link';

export default function AccountsHome() {
  const tiles = [
    {
      href: '/accounts/banks',
      title: 'Banks',
      description: 'Manage bank accounts and balances.'
    },
    {
      href: '/accounts/salaries',
      title: 'Salaries',
      description: 'Approve processed salary batches and pay from banks.'
    },
    {
      href: '/accounts/general-cash',
      title: 'General Cash Ledger',
      description: 'View all cash inflows and outflows for the office and projects.'
    },
    {
      href: '/admin/settings',
      title: 'Exchange Rate',
      description: 'Set default USD↔EGP exchange rate.'
    },
    {
      href: '/admin/expenses/pending',
      title: 'Pending Expenses',
      description: 'Approve submitted expenses.'
    },
    {
      href: '/accountant/time/pending',
      title: 'Pending Time (Accountant)',
      description: 'Final approval for time entries.'
    },
    {
      href: '/accounts/office-expenses',
      title: 'Office Expenses',
      description: 'Record and view office operating expenses deducted from banks.'
    }
  ];

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Accounts</h1>
        <p className="text-slate-400 font-light max-w-xl">Comprehensive financial management and ledger control center.</p>
      </header>

      <div className="grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {tiles.map(tile => (
          <Link 
            key={tile.href} 
            href={tile.href} 
            className="legal-card p-8 group hover:border-legal-gold/30 transition-all duration-500 flex flex-col justify-between h-full"
          >
            <div>
              <h2 className="mb-4 text-2xl font-serif text-white group-hover:text-legal-gold transition-colors">{tile.title}</h2>
              <p className="text-sm text-slate-500 font-light leading-relaxed">{tile.description}</p>
            </div>
            <div className="mt-8 flex items-center justify-end">
              <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold group-hover:translate-x-2 transition-transform">Access Portal →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
