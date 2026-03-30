"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { getAuth } from "@/lib/auth";

interface Perm { code:string; allowed:boolean }

function decodeJwtPayload(token?: string): any | null {
  if (!token) return null;
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

export default function AdminSettingsPage() {
  const [mounted,setMounted]=useState(false);
  const [role, setRole]=useState<string>('');

  useEffect(()=>{
    setMounted(true);
    const token=getAuth();
    if(!token) return;
    const payload=decodeJwtPayload(token);
    const userRole=payload?.role;
    if(!userRole) return;
    setRole(userRole);
  },[]);

  const getTilesForRole = (userRole: string) => {
    switch(userRole) {
      case 'OWNER':
      case 'MANAGING_PARTNER':
        return [
          { href: '/admin/permissions', title: 'User Permissions', description: 'Manage user permissions and access rights.' },
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
          { href: '/admin/assignments', title: 'Project Assignments', description: 'Assign lawyers to projects.' },
          { href: '/admin/groups', title: 'Groups', description: 'Create and manage lawyer groups.' },
          { href: '/admin/company', title: 'Company Info', description: 'Edit company details and logo.' },
          { href: '/admin/payroll', title: 'Payroll', description: 'Manage payroll and salaries.' },
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/accounts', title: 'Accounts', description: 'Access accounting dashboards and tools.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
          { href: '/admin/settings', title: 'Settings', description: 'System settings and configuration.' },
        ];
      
      case 'ADMIN':
        return [
          { href: '/admin/permissions', title: 'User Permissions', description: 'Manage user permissions and access rights.' },
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
          { href: '/admin/assignments', title: 'Project Assignments', description: 'Assign lawyers to projects.' },
          { href: '/admin/groups', title: 'Groups', description: 'Create and manage lawyer groups.' },
          { href: '/admin/company', title: 'Company Info', description: 'Edit company details and logo.' },
          { href: '/admin/payroll', title: 'Payroll', description: 'Manage payroll and salaries.' },
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/accounts', title: 'Accounts', description: 'Access accounting dashboards and tools.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
          { href: '/admin/settings', title: 'Settings', description: 'System settings and configuration.' },
        ];
      
      case 'ACCOUNTANT_MASTER':
        return [
          { href: '/admin/permissions', title: 'User Permissions', description: 'Manage user permissions and access rights.' },
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
          { href: '/admin/assignments', title: 'Project Assignments', description: 'Assign lawyers to projects.' },
          { href: '/admin/groups', title: 'Groups', description: 'Create and manage lawyer groups.' },
          { href: '/admin/company', title: 'Company Info', description: 'Edit company details and logo.' },
          { href: '/admin/payroll', title: 'Payroll', description: 'Manage payroll and salaries.' },
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/accounts', title: 'Accounts', description: 'Access accounting dashboards and tools.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
          { href: '/admin/settings', title: 'Settings', description: 'System settings and configuration.' },
        ];
      
      case 'ACCOUNTANT_ASSISTANT':
        return [
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
          { href: '/admin/assignments', title: 'Project Assignments', description: 'Assign lawyers to projects.' },
          { href: '/admin/groups', title: 'Groups', description: 'Create and manage lawyer groups.' },
          { href: '/admin/company', title: 'Company Info', description: 'Edit company details and logo.' },
          { href: '/admin/payroll', title: 'Payroll', description: 'Manage payroll and salaries.' },
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/accounts', title: 'Accounts', description: 'Access accounting dashboards and tools.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
          { href: '/admin/settings', title: 'Settings', description: 'System settings and configuration.' },
        ];
      
      case 'LAWYER_PARTNER':
        return [
          { href: '/clients', title: 'Clients', description: 'Manage client information and relationships.' },
          { href: '/projects', title: 'Projects', description: 'View and manage assigned projects.' },
          { href: '/admin/tasks', title: 'Tasks', description: 'Create and manage tasks for lawyers.' },
          { href: '/time', title: 'Time Entries', description: 'Log and track billable hours.' },
          { href: '/expenses', title: 'Expenses', description: 'Submit and track project expenses.' },
          { href: '/leaves', title: 'Leave Requests', description: 'Apply for and view leave status.' },
          { href: '/invoices', title: 'Invoices', description: 'Create and manage client invoices.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
        ];
      
      case 'LAWYER_MANAGER':
        return [
          { href: '/clients', title: 'Clients', description: 'Manage client information and relationships.' },
          { href: '/projects', title: 'Projects', description: 'View and manage assigned projects.' },
          { href: '/admin/tasks', title: 'Tasks', description: 'Create and manage tasks for lawyers.' },
          { href: '/time', title: 'Time Entries', description: 'Log and track billable hours.' },
          { href: '/expenses', title: 'Expenses', description: 'Submit and track project expenses.' },
          { href: '/leaves', title: 'Leave Requests', description: 'Apply for and view leave status.' },
          { href: '/invoices', title: 'Invoices', description: 'Create and manage client invoices.' },
          { href: '/admin/reports', title: 'Reports', description: 'View financial and operational reports.' },
        ];
      
      case 'LAWYER':
        return [
          { href: '/projects', title: 'Projects', description: 'View and manage assigned projects.' },
          { href: '/admin/tasks', title: 'Tasks', description: 'Create and manage tasks.' },
          { href: '/time', title: 'Time Entries', description: 'Log and track billable hours.' },
          { href: '/expenses', title: 'Expenses', description: 'Submit project expenses.' },
          { href: '/leaves', title: 'Leave Requests', description: 'Apply for leave.' },
        ];
      
      case 'EHAFuqgZ8':
        return [
          { href: '/projects', title: 'Projects', description: 'View and manage assigned projects.' },
          { href: '/admin/tasks', title: 'Tasks', description: 'Create and manage tasks.' },
          { href: '/time', title: 'Time Entries', description: 'Log and track billable hours.' },
          { href: '/expenses', title: 'Expenses', description: 'Submit project expenses.' },
          { href: '/leaves', title: 'Leave Requests', description: 'Apply for leave.' },
        ];
      
      case 'HR_MANAGER':
        return [
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/admin/payroll', title: 'Payroll', description: 'Manage payroll and salaries.' },
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
          { href: '/admin/assignments', title: 'Project Assignments', description: 'Assign lawyers to projects.' },
          { href: '/admin/groups', title: 'Groups', description: 'Create and manage lawyer groups.' },
          { href: '/admin/company', title: 'Company Info', description: 'Edit company details and logo.' },
          { href: '/admin/settings', title: 'Settings', description: 'System settings and configuration.' },
        ];
      
      case 'HR':
        return [
          { href: '/admin/hr', title: 'HR', description: 'Manage HR and leaves.' },
          { href: '/admin/employees', title: 'Employees', description: 'Manage employees and user accounts.' },
          { href: '/admin/positions', title: 'Positions', description: 'Define job positions and rates.' },
        ];
      
      default:
        return [];
    }
  };

  const tiles = getTilesForRole(role);

  if(!mounted) return null;

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Admin Settings</h1>
        <p className="text-slate-400 font-light max-w-xl">System configuration, user permissions, and organizational management.</p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile: any) => (
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
              <span className="text-[10px] uppercase tracking-[0.2em] text-legal-gold font-bold group-hover:translate-x-2 transition-transform">Configure →</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
