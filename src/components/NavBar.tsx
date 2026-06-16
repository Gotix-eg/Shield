"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getAuth, clearAuth } from "@/lib/auth";

type UserRole = string; // roles now dynamic
interface NavLink { href:string; label:string; key:string }
const ROLE_PAGES: Record<string,string[]> = {
  OWNER:["clients","projects","tasks","time","expenses","leaves","invoices","reports","accounts","payroll","settings","hr","agents"],
  MANAGING_PARTNER:["clients","projects","tasks","time","expenses","leaves","invoices","reports","accounts","payroll","settings","hr","agents"],
  ACCOUNTANT_MASTER:["clients","projects","expenses","leaves","invoices","reports","accounts","payroll","agents"],
  ACCOUNTANT_ASSISTANT:["clients","projects","expenses","leaves","invoices","accounts"],
  ADMIN:["clients","projects","tasks","time","reports","admin_time","agents"],
  LAWYER_PARTNER:["clients","projects","tasks","time","expenses","leaves","invoices","reports","agents"],
  LAWYER_MANAGER:["clients","projects","tasks","time","expenses","leaves","reports","agents"],
  LAWYER:["projects","tasks","time","expenses","leaves"],
  HR_MANAGER:["hr","payroll","leaves","admin_time"],
  HR:["hr","leaves"],
};

  const links:NavLink[] = [
    { href: "/clients",   label: "Clients", key:"clients" },
    { href: "/projects", label: "Projects", key:"projects" },
    { href: "/admin/tasks", label: "Tasks", key:"tasks" },
    { href: "/time", label: "Time", key:"time" },
    { href: "/expenses", label: "Expenses", key:"expenses" },
    { href: "/leaves", label: "Leaves", key:"leaves" },
    { href: "/invoices",  label: "Invoices", key:"invoices" },
    { href: "/admin/reports", label: "Reports", key:"reports" },
    { href: "/admin/time", label: "Admin Time", key:"admin_time" },
    { href: "/accounts", label: "Accounts", key:"accounts" },
    { href: "/admin/payroll", label: "Payroll", key:"payroll" },
    { href: "/admin", label: "Admin", key:"settings" },
    { href: "/admin/hr", label: "HR", key:"hr" },
  ];

function decodeRole(token?:string):UserRole|null{
  if(!token) return null;
  try{
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    const payload=JSON.parse(atob(padded));
    return (payload.role??"STAFF") as any;
  }catch{ return null; }
}

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut, Bell, ChevronDown, LayoutDashboard, Users, FolderKanban, CheckSquare, Clock, CreditCard, Calendar, FileText, BarChart3, Settings, Users2, Banknote, Briefcase } from "lucide-react";

export default function NavBar() {
  const [role,setRole]=useState<UserRole|null>(() => decodeRole(getAuth() || undefined));
  const [unread,setUnread]=useState(0);
  
  const pathname = usePathname();
  const router = useRouter();

  useEffect(()=>{
    const token=getAuth()||undefined;
    setRole(decodeRole(token));
    // fetch unread notifications
    fetch('/api/notifications?unread=true',{headers: token?{Authorization:`Bearer ${token}`}:{}}).then(r=>r.json()).then((list:any)=>setUnread(list.length)).catch(()=>{});
  },[]);

  // Hide navbar on login, register or when not authenticated
  const tokenRaw = getAuth();
  if (!tokenRaw || pathname === "/" || pathname.includes("login") || pathname.includes("register")) return null;

  const resolvedRole = role ?? decodeRole(tokenRaw || undefined);
  const allowedPages = ROLE_PAGES[resolvedRole as string] || [];

  const handleLogout = () => {
    clearAuth();
    router.push("/login");
  };

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", key: "dashboard", icon: LayoutDashboard },
    { href: "/clients", label: "Clients", key: "clients", icon: Users },
    { href: "/projects", label: "Projects", key: "projects", icon: FolderKanban },
    { href: "/admin/tasks", label: "Tasks", key: "tasks", icon: CheckSquare },
    { href: "/agents", label: "Agents", key: "agents", icon: Briefcase },
    { href: "/time", label: "Time", key: "time", icon: Clock },
    { href: "/expenses", label: "Expenses", key: "expenses", icon: CreditCard },
    { href: "/leaves", label: "Leaves", key: "leaves", icon: Calendar },
    { href: "/invoices", label: "Invoices", key: "invoices", icon: FileText },
    { href: "/admin/reports", label: "Reports", key: "reports", icon: BarChart3 },
    { href: "/admin/time", label: "Admin Time", key: "admin_time", icon: Clock },
    { href: "/accounts", label: "Accounts", key: "accounts", icon: Banknote },
    { href: "/admin/payroll", label: "Payroll", key: "payroll", icon: CreditCard },
    { href: "/admin", label: "Settings", key: "settings", icon: Settings },
    { href: "/admin/hr", label: "HR", key: "hr", icon: Users2 },
  ];

  return (
    <aside className="w-[var(--sidebar-width)] h-screen sticky top-0 left-0 bg-[#0a0f1a] border-r border-white/5 flex flex-col z-[100] shrink-0">
      {/* Sidebar Logo */}
      <div className="p-8 pb-12">
        <Link href="/dashboard" className="group flex flex-col items-center">
          <span className="text-4xl font-serif font-bold text-legal-gold tracking-tighter leading-none group-hover:scale-105 transition-transform duration-500">PRO LAW</span>
          <span className="text-[8px] uppercase tracking-[0.6em] text-slate-500 font-bold mt-2 group-hover:text-legal-gold transition-colors duration-500">Elite Firm Management</span>
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-6 space-y-1 custom-scrollbar">
        {navLinks.filter(l => l.key === "dashboard" || allowedPages.includes(l.key)).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-xl text-[13px] font-medium tracking-wide transition-all duration-300 relative group ${
                active 
                  ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon className={`w-4.5 h-4.5 transition-colors duration-300 ${active ? "text-legal-gold" : "text-slate-500 group-hover:text-white"}`} />
              <span className="relative z-10">{label}</span>
              {active && (
                <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-4 rounded-l-full bg-legal-gold"></span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-6 mt-auto border-t border-white/5 space-y-4">
        <Link href="/notifications" className="flex items-center justify-between px-5 py-3.5 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all duration-300 group">
          <div className="flex items-center gap-4">
            <Bell className="w-4.5 h-4.5 text-slate-400 group-hover:text-legal-gold transition-colors" />
            <span className="text-[13px] font-medium text-slate-400 group-hover:text-white transition-colors">Notifications</span>
          </div>
          {unread > 0 && (
            <span className="bg-red-500 text-[10px] font-bold text-white px-2 py-0.5 rounded-full animate-pulse">
              {unread}
            </span>
          )}
        </Link>

        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-4 px-5 py-4 rounded-xl bg-red-500/5 border border-red-500/10 hover:bg-red-500/20 hover:border-red-500/30 group transition-all duration-500 shadow-xl"
        >
          <LogOut className="w-4.5 h-4.5 text-red-400 transition-colors" />
          <span className="text-[13px] font-bold tracking-widest text-red-400 group-hover:text-red-300">SIGN OUT</span>
        </button>
      </div>
    </aside>
  );
}
