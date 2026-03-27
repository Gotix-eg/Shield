"use client";
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
function getCompanyId(): number | undefined {
  const t = getAuth();
  if (!t) return undefined;
  try {
    return JSON.parse(atob(t.split('.')[1])).companyId;
  } catch {
    return undefined;
  }
}

interface Task {
  id: number;
  title: string;
  status: string;
  dueDate: string;
  client?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  assignee: { id: number; name: string };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: "",
    assigneeId: "",
    dueDate: "",
    clientId: "",
    projectId: "",
    description: "",
  });

  // reference lists
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string; clientId: number }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const cid = getCompanyId();
    const qs = cid ? `?companyId=${cid}` : "";
    Promise.all([
      fetch(`/api/list/clients${qs}`, { headers: buildAuth() }).then(r=>r.json()),
      fetch(`/api/list/projects${qs}`, { headers: buildAuth() }).then(r=>r.json()),
    ])
      .then(([c, p]) => {
        setClients(c);
        setProjects(p);
              })
      .catch(() => {});
  }, []);

  // Load lawyers when project is selected
  useEffect(() => {
    if (form.projectId) {
      fetch(`/api/list/lawyers?projectId=${form.projectId}`, { headers: buildAuth() })
        .then(r => r.json())
        .then(setLawyers)
        .catch(() => {}); // Removed setLawyers call here
    } else {
      setLawyers([]);
    }
  }, [form.projectId]);

  const load = () => {
    setLoading(true);
    fetch("/api/tasks", { headers: buildAuth() })
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => toast.error("Error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const addTask = async () => {
    try {
            const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuth() },
        body: JSON.stringify({
          ...form,
          assigneeId: parseInt(form.assigneeId || "0"),
          clientId: form.clientId ? parseInt(form.clientId) : undefined,
          projectId: form.projectId ? parseInt(form.projectId) : undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(()=>null);
        const msg = data?.error || 'Bad Request';
        throw new Error(msg);
      }
      toast.success("Task created");
      setShowModal(false);
      setForm({
        title: "",
        assigneeId: "",
        dueDate: "",
        clientId: "",
        projectId: "",
        description: "",
      });
      load();
    } catch (err:any) {
      toast.error(err.message || "Creation failed");
    }
  };

  function buildAuth(): { [key: string]: string } {
    const t = getAuth();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  const reassign = async (task: Task)=>{
    if(!task.project?.id){toast.error('No project');return;}
    const choices = await fetch(`/api/list/lawyers?projectId=${task.project.id}`,{headers:buildAuth()}).then(r=>r.json()).catch(()=>[]);
    if(!choices.length){toast.error('No lawyers');return;}
    const list = choices.map((l:any)=>`${l.id}: ${l.name}`).join('\n');
    const ans = prompt(`Select lawyer by id:\n${list}`);
    if(!ans) return;
    const lid = parseInt(ans);
    if(Number.isNaN(lid)){toast.error('Invalid');return;}
    try{
      await fetch(`/api/tasks/${task.id}`,{method:'PATCH',headers:{'Content-Type':'application/json',...buildAuth()},body:JSON.stringify({assigneeId:lid})});
      toast.success('Reassigned');
      load();
    }catch{toast.error('Failed');}
  };
  
  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...buildAuth() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const msg = (await res.json().catch(()=>null))?.error || 'Failed';
        throw new Error(msg);
      }
      const updated = await res.json();
      // optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
      toast.success('Updated');
    } catch (e:any) {
      toast.error(e.message || 'Update failed');
    }
  };

  return (
    <div className="dashboard-container">
      <Toaster />
      <header className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <h1 className="text-4xl font-serif text-white mb-2 tracking-tight">Tasks Management</h1>
            <p className="text-slate-400 font-light max-w-xl">Assign, track, and manage legal tasks across all active projects.</p>
          </div>
          <button onClick={()=>setShowModal(true)} className="btn-legal px-8">Add New Task</button>
        </div>
      </header>

      {loading ? (
        <div className="legal-card p-16 text-center text-slate-500 italic font-light">Loading tasks...</div>
      ) : (
        <div className="legal-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Task Title</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Client / Project</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Assignee</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Due Date</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold">Status</th>
                  <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-legal-gold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tasks.length === 0 ? (
                  <tr><td colSpan={6} className="px-8 py-16 text-center text-slate-500 italic font-light">No tasks found.</td></tr>
                ) : (
                  tasks.map((t) => (
                    <tr key={t.id} className="group hover:bg-white/5 transition-colors">
                      <td className="px-8 py-6 text-slate-200 font-medium">{t.title}</td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-slate-400 text-xs font-light">{t.client?.name || "-"}</span>
                          <span className="text-slate-500 text-[10px] uppercase tracking-wider">{t.project?.name || "-"}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-slate-300">{t.assignee.name}</td>
                      <td className="px-8 py-6 text-slate-400 font-mono text-xs">{new Date(t.dueDate).toLocaleDateString()}</td>
                      <td className="px-8 py-6">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${
                          t.status === 'DONE' ? 'bg-emerald-500/10 text-emerald-400' :
                          t.status === 'IN_PROGRESS' ? 'bg-legal-gold/10 text-legal-gold' :
                          'bg-amber-500/10 text-amber-400'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-center space-x-4">
                        {t.status === 'PENDING' && (
                          <button className="text-legal-gold hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest" onClick={() => updateStatus(t.id,'IN_PROGRESS')}>Start</button>
                        )}
                        {t.status === 'IN_PROGRESS' && (
                          <button className="text-emerald-400 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest" onClick={() => updateStatus(t.id,'DONE')}>Complete</button>
                        )}
                        <button className="text-slate-500 hover:text-legal-gold transition-colors text-[10px] font-bold uppercase tracking-widest" onClick={() => reassign(t)}>Assign</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-[#0a0f1a]/80 backdrop-blur-md flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
          <div className="legal-card bg-surface w-full max-w-lg p-10 border-legal-gold/20 shadow-2xl animate-in zoom-in-95 duration-300">
            <h2 className="text-3xl font-serif text-white mb-8">Create Task</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Task Title</label>
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                  placeholder="e.g. Draft Purchase Agreement"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Description</label>
                <textarea
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors h-24 resize-none"
                  placeholder="Additional task details..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Client</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value, projectId: '' })}
                  >
                    <option value="" className="bg-slate-900">Select Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id} className="bg-slate-900">{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Project</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors disabled:opacity-30"
                    value={form.projectId}
                    onChange={e => setForm({ ...form, projectId: e.target.value })}
                    disabled={!form.clientId}
                  >
                    <option value="" className="bg-slate-900">Select Project</option>
                    {projects.filter(p => !form.clientId || p.clientId === parseInt(form.clientId)).map(p => (
                      <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Assignee</label>
                  <select
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={form.assigneeId}
                    onChange={e => setForm({ ...form, assigneeId: e.target.value })}
                  >
                    <option value="" className="bg-slate-900">Select Lawyer</option>
                    {lawyers.map(l => (
                      <option key={l.id} value={l.id} className="bg-slate-900">{l.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">Due Date</label>
                  <input
                    type="date"
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:border-legal-gold/50 transition-colors"
                    value={form.dueDate}
                    onChange={e => setForm({ ...form, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 btn-legal-outline py-3"
              >
                Cancel
              </button>
              <button
                onClick={addTask}
                disabled={!form.title.trim() || !form.assigneeId || !form.dueDate}
                className="flex-[2] btn-legal py-3 disabled:opacity-50"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}