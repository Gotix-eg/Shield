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
  const [perms,setPerms]=useState<Record<string,boolean>>({});
  const [mounted,setMounted]=useState(false);
  useEffect(()=>{
    setMounted(true);
    const token=getAuth();
    if(!token) return;
    const payload=decodeJwtPayload(token);
    const uid=payload?.id??payload?.sub;
    const role=payload?.role;
    if(!uid) return;
    console.log('Admin page - User ID:', uid, 'Role:', role);
    fetch(`/api/users/${uid}/permissions`,{headers:{Authorization:`Bearer ${token}`}})
      .then(r=>r.ok?r.json():[] as Perm[])
      .then(list=>{
        console.log('Permissions fetched:', list);
        const obj:Record<string,boolean>={};
        list.forEach((p:Perm)=>{ if(p.allowed) obj[p.code]=true; });
        console.log('Permissions object:', obj);
        setPerms(obj);
      })
      .catch(err=>{
        console.error('Error fetching permissions:', err);
      });
  },[]);

  const tilesAll = [
  {
    href: "/admin/company",
    title: "Company Info",
    perm: "admin_all",
    description: "Edit company details and logo.",
  },
  {
    href: "/admin/groups",
    title: "Groups",
    perm: "manage_groups",
    description: "Create and manage lawyer groups.",
  },
    {
      href: "/admin/positions",
      title: "Positions",
      perm: "positions",
      description: "Define job positions and default hourly rates.",
    },

    

    {
      href: "/admin/assignments",
      title: "Project Assignments",
      perm: "assign_projects",
      description: "Assign lawyers to projects and set rates.",
    },
    {
      href: "/manager/time/pending",
      title: "Pending Time (Manager)",
      perm: "approve_time",
      description: "Manager approval for time entries.",
    }
  ];

  if(!mounted) return null;
  // detect role from token
  const token=getAuth();
  let role:string|undefined;
  try{ if(token){ role=decodeJwtPayload(token)?.role; }}catch{}
  console.log('Detected role:', role);
  let tiles: typeof tilesAll;
  if(role==='ACCOUNTANT_MASTER'){
    // TEMPORARY: Show all tiles for ACCOUNTANT_MASTER without permission checks
    console.log('ACCOUNTANT_MASTER detected - showing all tiles');
    tiles=[
      { href: '/admin/permissions', title: 'User Permissions', perm: '', description: 'Manage user permissions and access rights.' },
      { href: '/admin/employees', title: 'Employees', perm: 'employees', description: 'Manage employees and user accounts.' },
      { href: '/admin/positions', title: 'Positions', perm: 'positions', description: 'Define job positions and rates.' },
      { href: '/admin/assignments', title: 'Project Assignments', perm: 'assign_projects', description: 'Assign lawyers to projects.' },
      { href: '/admin/groups', title: 'Groups', perm: 'manage_groups', description: 'Create and manage lawyer groups.' },
      { href: '/admin/company', title: 'Company Info', perm: 'admin_all', description: 'Edit company details and logo.' },
      { href: '/accounts', title: 'Accounts', perm: '', description: 'Access accounting dashboards and tools.' },
      { href: '/admin/expenses/pending', title: 'Pending Expenses', perm: '', description: 'Approve submitted expenses.' },
      { href: '/accountant/time/pending', title: 'Pending Time (Accountant)', perm: '', description: 'Final approval for time entries.' },
      { href: '/admin/office-expenses', title: 'Office Expenses', perm: '', description: 'Review office operating expenses.' },
      { href: '/admin/settings', title: 'Settings', perm: '', description: 'System settings and configuration.' },
    ];
    console.log('ACCOUNTANT_MASTER tiles:', tiles);
  }else if(role==='ACCOUNTANT_ASSISTANT'){
    tiles=[
      { href: '/accounts', title: 'Accounts', perm: '', description: 'Access accounting dashboards and tools.' },
      { href: '/admin/expenses/pending', title: 'Pending Expenses', perm: '', description: 'Approve submitted expenses.' },
      { href: '/accountant/time/pending', title: 'Pending Time (Accountant)', perm: '', description: 'Final approval for time entries.' },
      { href: '/admin/office-expenses', title: 'Office Expenses', perm: '', description: 'Review office operating expenses.' },
    ];
  }else if(role==='HR_MANAGER'){
    tiles=[
            {href:"/admin/employees",title:"Employees",perm:"employees",description:"Manage employees."}
    ];
  }else if(role==='LAWYER_MANAGER'){
    tiles=[
      {href:"/manager/time/pending",title:"Pending Time (Manager)",perm:"approve_time",description:"Approve submitted time entries."}
    ];
  }else if(role==='LAWYER_PARTNER'){
    tiles=[
      {href:"/manager/time/pending",title:"Pending Time (Manager)",perm:"approve_time",description:"Approve submitted time entries."}
    ];
  }else{
    tiles=tilesAll;
  }

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Admin Settings</h1>
        <p className="text-slate-400 font-light max-w-xl">System configuration, user permissions, and organizational management.</p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {(() => {
          let filteredTiles = tiles;
          
          // TEMPORARY: Bypass permission checks for ACCOUNTANT_MASTER
          if(role === 'ACCOUNTANT_MASTER') {
            console.log('ACCOUNTANT_MASTER - bypassing permission checks');
            filteredTiles = tiles; // Show all tiles
          } else {
            filteredTiles = tiles.filter(t=>{
              if(Object.keys(perms).length===0) return !t.perm; // no perms loaded => show only non-protected tiles
              return !t.perm || perms[t.perm] || perms["admin_all"];
            });
          }
          
          console.log('All tiles:', tiles);
          console.log('Permissions:', perms);
          console.log('Filtered tiles:', filteredTiles);
          return filteredTiles;
        })().map((tile: any) => (
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
