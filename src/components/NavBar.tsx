"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { getAuth, clearAuth } from "@/lib/auth";

type UserRole = string; // roles now dynamic
interface NavLink { href:string; label:string; key:string }
const ADMIN_ROLES = ["ADMIN","MANAGING_PARTNER","ACCOUNTANT_MASTER","ACCOUNTANT_ASSISTANT","LAWYER_PARTNER","LAWYER_MANAGER"];
const ROLE_PAGES: Record<string,string[]> = {
  OWNER:["clients","projects","time","expenses","invoices","reports","accounts","settings","hr","leaves","notifications","admin_time","tasks"],
  MANAGING_PARTNER:["clients","projects","time","expenses","invoices","reports","accounts","settings","hr","leaves","notifications","admin_time","tasks"],
  ADMIN:["clients","projects","time","expenses","invoices","reports","accounts","settings","hr","leaves","notifications","admin_time","tasks"],
  ACCOUNTANT_MASTER:["invoices","reports","accounts","trust","leaves","payroll","notifications"],
  ACCOUNTANT_ASSISTANT:["invoices","accounts","leaves","notifications"],
  LAWYER_PARTNER:["clients","projects","time","reports","leaves","settings"],
  HR_MANAGER:["hr","employees","payroll","leaves","positions","notifications","admin_time"],
  LAWYER_MANAGER:["time","expenses","reports","leaves","notifications","settings","admin_time","tasks"],
  HR:["hr","payroll","leaves","notifications"],
  LAWYER:["time","expenses","leaves","notifications","tasks"],
  ADMIN_REPORTS:["clients","projects","time","expenses","invoices","reports","settings","leaves","notifications"],
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
    const payload=JSON.parse(atob(token.split('.')[1]));
    return (payload.role??"STAFF") as any;
  }catch{ return null; }
}

import { useEffect, useState } from "react";
import { LogOut, Bell, ChevronDown } from "lucide-react";

export default function NavBar() {
  const [role,setRole]=useState<UserRole|null>(null);
  const [unread,setUnread]=useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(()=>{
    const token=getAuth()||undefined;
    const payload=token?JSON.parse(atob(token.split('.')[1])):null;
    setRole(payload?.role||null);
    // fetch unread notifications
    fetch('/api/notifications?unread=true',{headers: token?{Authorization:`Bearer ${token}`}:{}}).then(r=>r.json()).then((list:any)=>setUnread(list.length)).catch(()=>{});
  },[]);

  // Hide navbar on login, register or when not authenticated
  const tokenRaw = getAuth();
  if (!tokenRaw || pathname === "/" || pathname.includes("login") || pathname.includes("register")) return null;

  const allowedPages = ROLE_PAGES[role as string] || [];

  const handleLogout = () => {
    clearAuth();
    window.location.href = "/login";
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
      isScrolled ? "bg-legal-900/95 backdrop-blur-2xl border-b border-white/10 py-2 shadow-2xl" : "bg-transparent py-4"
    }`}>
      <div className="mx-auto flex max-w-[1440px] items-center justify-between px-10">
        <div className="flex items-center gap-12">
          <Link href="/dashboard" className="group flex flex-col items-center">
            <span className="text-3xl font-serif font-bold text-legal-gold tracking-tighter leading-none group-hover:scale-105 transition-transform">PRO LAW</span>
            <span className="text-[7px] uppercase tracking-[0.6em] text-slate-400 font-bold mt-1 group-hover:text-legal-gold transition-colors">Elite Firm Management</span>
          </Link>
          
          <div className="hidden lg:flex items-center gap-2">
            {links.filter(l => allowedPages.includes(l.key)).map(({ href, label }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-full text-[12px] font-medium tracking-wide transition-all duration-500 relative group overflow-hidden ${
                    active 
                      ? "text-white bg-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]" 
                      : "text-slate-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <span className="relative z-10">{label}</span>
                  {active && (
                    <span className="absolute inset-0 bg-gradient-to-r from-legal-gold/20 to-transparent opacity-50"></span>
                  )}
                  <span className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-legal-gold transition-all duration-500 ${
                    active ? "opacity-100 scale-100" : "opacity-0 scale-0 group-hover:opacity-50 group-hover:scale-100"
                  }`}></span>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Link href="/notifications" className="relative group">
            <div className="p-2.5 rounded-full bg-white/5 border border-white/5 group-hover:bg-white/10 group-hover:border-white/20 transition-all duration-300">
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-legal-gold transition-colors" />
              {unread > 0 && (
                <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center border-2 border-legal-900 animate-bounce">
                  {unread}
                </span>
              )}
            </div>
          </Link>

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/5 border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 group transition-all duration-500 shadow-lg"
          >
            <span className="text-xs font-bold tracking-widest text-slate-300 group-hover:text-red-400">SIGN OUT</span>
            <LogOut className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>
    </nav>
  );
}