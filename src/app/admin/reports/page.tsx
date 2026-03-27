"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { getAuth } from "@/lib/auth";

export default function AdminReportsPage() {
  const baseTiles = [
    {
      href: "/admin/reports/costs",
      title: "Cost Report",
      description: "View costs (hours, rates, expenses) per project/lawyer.",
      key: "costs"
    },
    {
      href: "/admin/reports/profit-loss",
      title: "Profit & Loss",
      description: "See advance payments, costs, and profit per project/client.",
      key: "profit"
    },
    {
      href: "/admin/reports/bank-accounts",
      title: "Bank Accounts Report",
      description: "View bank account transactions and balances.",
      key: "bank-accounts"
    },
    {
      href: "/admin/reports/salaries",
      title: "Salary Report",
      description: "View all office salaries by employee and period.",
      key: "salaries"
    },
    {
      href: "/admin/reports/office-expenses",
      title: "Office Expenses",
      description: "All office expense transactions and totals.",
      key: "office"
    },
    {
      href: "/admin/reports/lawyers",
      title: "Lawyers Performance",
      description: "Weekly hours, utilisation and rating per lawyer.",
      key: "lawyers"
    }
  ];

  const [role, setRole] = useState<string | null>(null);
  useEffect(() => {
    const token = getAuth();
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setRole(payload.role || null);
      } catch {}
    }
  }, []);

  const tiles = React.useMemo(()=>{
    if(role==='LAWYER_MANAGER'){
      return baseTiles.filter(t=>t.key!=='profit');
    }
    return baseTiles;
  },[role]);

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Financial Reports</h1>
        <p className="text-slate-400 font-light max-w-xl">Comprehensive analytical reports on costs, performance, and profitability.</p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold group-hover:translate-x-2 transition-transform">Explore Report →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
