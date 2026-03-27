"use client";
import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";
import Link from "next/link";

export default function HRDashboard() {
  const [tiles,setTiles]=useState<{href:string;label:string}[]>([]);
  useEffect(()=>{
    const token=getAuth();
    let role:string|null=null;
    try{ role = token? JSON.parse(atob(token.split('.')[1])).role:null;}catch{}
    if(role==="HR"){
      setTiles([
        { href: "/admin/leaves", label: "Leave Requests" },
        { href: "/admin/attendance", label: "Attendance" },
        { href: "/admin/penalties", label: "Penalties" },
        { href: "/admin/payroll", label: "Payroll" },
      ]);
    }else if(role==="HR_MANAGER"){ 
      setTiles([
        { href: "/admin/employees", label: "Employees" },
        { href: "/admin/leaves", label: "Leave Requests" },
        { href: "/admin/attendance", label: "Attendance" },
                { href: "/admin/penalties", label: "Penalties" },
        { href: "/admin/payroll", label: "Payroll" },
      ]);
    }else{
      setTiles([
        { href: "/admin/employees", label: "Employees" },
        { href: "/admin/leaves", label: "Leave Requests" },
        { href: "/admin/attendance", label: "Attendance" },
                { href: "/admin/penalties", label: "Penalties" },
        { href: "/admin/payroll", label: "Payroll" },
      ]);
    }
  },[]);
  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">HR Management</h1>
        <p className="text-slate-400 font-light max-w-xl">Centralized hub for employee records, leaves, and attendance.</p>
      </header>
      
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="legal-card p-10 flex flex-col items-center justify-center text-center group hover:border-legal-gold/30 transition-all duration-500"
          >
            <div className="w-12 h-12 rounded-full bg-legal-gold/5 flex items-center justify-center mb-6 group-hover:bg-legal-gold/10 transition-colors">
              <Settings className="w-6 h-6 text-legal-gold/40 group-hover:text-legal-gold transition-colors" />
            </div>
            <span className="text-lg font-serif text-slate-300 group-hover:text-white transition-colors">{t.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
import { Settings } from "lucide-react";
