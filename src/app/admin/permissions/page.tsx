"use client";
import { useEffect, useState } from "react";
import clsx from "clsx";
import PermissionsMatrix from "@/components/admin/PermissionsMatrix";

interface User {
  id: number;
  name: string | null;
  email: string;
}

type ScopeType = "ALL" | "CLIENT" | "PROJECT" | "LAWYER";

export interface UserPermission {
  page: string;
  enabled: boolean;
  clientIds: number[];
  projectIds: number[];
  itemIds: number[];
  lawyerIds: number[];
}

function authHeaders(): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token =
    localStorage.getItem("authToken") ?? localStorage.getItem("token") ?? "";
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function PermissionsPage() {
  const [projects, setProjects] = useState<{id:number,name:string}[]>([]);
  const [projectId,setProjectId] = useState<string>("ALL");
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [initialPerms, setInitialPerms] = useState<UserPermission[]>([]);

  // load projects on mount
  useEffect(()=>{
    fetch('/api/projects', { headers: authHeaders() }).then(r=>r.json()).then(arr=>{
      setProjects(arr);
      if(arr.length>0){
        setProjectId(String(arr[0].id));
      }else{
        // no projects, fetch all users
        fetch('/api/users',{headers:authHeaders()})
          .then(r=>r.json()).then(data=>Array.isArray(data)?setUsers(data):[]);
      }
    });
  },[]);

  // load users whenever projectId changes
  useEffect(() => {
    if(projectId==='ALL'){ // fetch all
      fetch('/api/users',{headers:authHeaders()}).then(r=>r.json()).then(d=>Array.isArray(d)?setUsers(d):[]);
      return;
    }
    fetch(`/api/users?projectId=${projectId}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data => (Array.isArray(data) ? setUsers(data) : []));
  }, [projectId]);

  // load permissions when user changes
  useEffect(() => {
    if (!selectedUser) return;
    fetch(`/api/user-permissions?userId=${selectedUser.id}`, { headers: authHeaders() })
      .then(r => r.json())
      .then(data =>
        Array.isArray(data) ? setInitialPerms(data) : setInitialPerms([])
      );
  }, [selectedUser]);

  async function handleSave(perms: UserPermission[]) {
    if (!selectedUser) return;
    const hdrs: Record<string,string> = { "Content-Type": "application/json", ...authHeaders() };
    await fetch("/api/user-permissions", {
      method: "POST",
      headers: hdrs,
      body: JSON.stringify({ userId: selectedUser.id, permissions: perms })
    });
    alert("Permissions saved");
  }

  return (
    <div className="dashboard-container">
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Permissions Matrix</h1>
        <p className="text-slate-400 font-light max-w-xl">Granular access control management for firm members and project teams.</p>
      </header>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Users list */}
        <aside className="lg:w-1/3 xl:w-1/4 space-y-8">
          <div className="legal-card p-6">
            <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4 block">Filter by Project</label>
            <select 
              value={projectId} 
              onChange={e=>setProjectId(e.target.value)} 
              className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
            >
              <option value="ALL" className="bg-slate-900">All Projects</option>
              {projects.map(p=> <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>)}
            </select>
          </div>

          <div className="legal-card p-6">
            <h2 className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-6">System Users</h2>
            <div className="space-y-2 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {users.map(u => (
                <div
                  key={u.id}
                  className={clsx(
                    "cursor-pointer rounded-xl px-4 py-3 border transition-all duration-300 group",
                    selectedUser?.id === u.id 
                      ? "bg-legal-gold/10 border-legal-gold/30" 
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  )}
                  onClick={() => setSelectedUser(u)}
                >
                  <div className="flex flex-col gap-1">
                    <span className={clsx(
                      "text-sm font-medium transition-colors",
                      selectedUser?.id === u.id ? "text-legal-gold" : "text-slate-300 group-hover:text-white"
                    )}>
                      {u.name || "Unnamed User"}
                    </span>
                    <span className="text-[10px] text-slate-500 font-light truncate">{u.email}</span>
                  </div>
                  
                  {selectedUser?.id === u.id && (
                    <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2 duration-300">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleSave(initialPerms); }}
                        className="btn-legal py-1 px-3 text-[9px]"
                      >
                        Apply Perms
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); window.open(`/admin?as=${u.id}`, '_blank'); }}
                        className="btn-legal-outline py-1 px-3 text-[9px]"
                      >
                        Preview
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Permission matrix */}
        <main className="flex-1">
          {selectedUser ? (
            <div className="legal-card p-8 min-h-[600px] animate-in fade-in slide-in-from-right-4 duration-700">
              <div className="flex items-center justify-between mb-10 border-b border-white/5 pb-6">
                <div>
                  <h2 className="text-2xl font-serif text-white">Access Rights: {selectedUser.name || selectedUser.email}</h2>
                  <p className="text-xs text-slate-500 font-light mt-1">Configuring module-level and resource-specific permissions.</p>
                </div>
                <button
                  onClick={() => handleSave(initialPerms)}
                  className="btn-legal px-8"
                >
                  Save Global Matrix
                </button>
              </div>
              <PermissionsMatrix
                userId={selectedUser.id}
                initialPermissions={initialPerms}
                onSave={handleSave}
              />
            </div>
          ) : (
            <div className="legal-card p-16 h-full flex flex-col items-center justify-center text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h3 className="text-xl font-serif text-white mb-2">No User Selected</h3>
              <p className="text-slate-500 text-sm max-w-xs font-light">Select a user from the directory to review or modify their system access rights.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}