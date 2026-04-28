"use client";
import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
import { Download, Upload } from "lucide-react";
import type { Task, TaskCategory, SelectOption } from "@/components/tasks/types";
import TaskLanding from "@/components/tasks/TaskLanding";
import GeneralTaskSection from "@/components/tasks/GeneralTaskSection";
import LitigationSection from "@/components/tasks/LitigationSection";
import IPSection from "@/components/tasks/IPSection";
import TaskDetailModal from "@/components/tasks/TaskDetailModal";

function getCompanyId(): number | undefined {
  const t = getAuth();
  if (!t) return undefined;
  try {
    const part = t.split('.')[1];
    if (!part) return undefined;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)).companyId;
  } catch { return undefined; }
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<TaskCategory>("landing");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const [clients, setClients] = useState<SelectOption[]>([]);
  const [projects, setProjects] = useState<(SelectOption & { clientId?: number })[]>([]);
  const [lawyers, setLawyers] = useState<SelectOption[]>([]);
  const [agents, setAgents] = useState<SelectOption[]>([]);

  function buildAuth(): { [key: string]: string } {
    const t = getAuth();
    return t ? { Authorization: `Bearer ${t}` } : {};
  }

  useEffect(() => {
    const cid = getCompanyId();
    const qs = cid ? `?companyId=${cid}` : "";
    Promise.all([
      fetch(`/api/list/clients${qs}`, { headers: buildAuth() }).then(r => r.json()),
      fetch(`/api/list/projects${qs}`, { headers: buildAuth() }).then(r => r.json()),
      fetch(`/api/list/lawyers${qs}`, { headers: buildAuth() }).then(r => r.json()),
      fetch(`/api/agents`, { headers: buildAuth() }).then(r => r.json()),
    ])
      .then(([c, p, l, a]) => {
        setClients(Array.isArray(c) ? c : []);
        setProjects(Array.isArray(p) ? p : []);
        setLawyers(Array.isArray(l) ? l : []);
        setAgents(Array.isArray(a) ? a : []);
      })
      .catch(() => {});
  }, []);

  const load = () => {
    setLoading(true);
    fetch("/api/tasks", { headers: buildAuth() })
      .then(r => r.json())
      .then(d => setTasks(Array.isArray(d) ? d : []))
      .catch(() => toast.error("Error loading tasks"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const taskCounts = useMemo(() => {
    const counts: Record<string, number> = { GENERAL: 0, CORPORATE: 0, LITIGATION: 0, IP: 0 };
    if (!Array.isArray(tasks)) return counts;
    tasks.forEach(t => {
      if (!t) return;
      const type = (t.taskType || "GENERAL") as string;
      if (counts[type] !== undefined) counts[type]++;
    });
    return counts;
  }, [tasks]);

  const safeDate = (d: any) => {
    if (!d) return "-";
    try {
      const dt = new Date(d);
      return isNaN(dt.getTime()) ? "-" : dt.toLocaleDateString();
    } catch { return "-"; }
  };

  const createTask = async (data: any) => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuth() },
        body: JSON.stringify({
          ...data,
          assigneeIds: data.assigneeIds,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || "Bad Request");
      }
      toast.success("Task created");
      load();
    } catch (err: any) {
      toast.error(err.message || "Creation failed");
      throw err;
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...buildAuth() },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed");
      const updated = await res.json();
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
      toast.success("Status updated");
    } catch {
      toast.error("Update failed");
    }
  };

  const exportToExcel = () => {
    if (tasks.length === 0) {
      toast.error("No tasks to export");
      return;
    }

    // Identify all unique keys in actionDetails to create columns for them
    const actionDetailKeys = new Set<string>();
    tasks.forEach(t => {
      if (t.actionDetails) {
        Object.keys(t.actionDetails).forEach(k => actionDetailKeys.add(k));
      }
    });
    const detailKeysList = Array.from(actionDetailKeys);

    const headers = [
      "Title", "Type", "IP Type", "IP Action", "Client", "Project", 
      "Assignees", "Agent", "Due Date", "Status", "Description",
      ...detailKeysList.map(k => `Detail: ${k}`)
    ];

    const rows = tasks.map(t => [
      t.title, 
      t.taskType || "", 
      t.ipType || "", 
      t.ipAction || "",
      t.client?.name || "", 
      t.project?.name || "", 
      t.assignees?.map(a => a?.name).filter(Boolean).join("; ") || "", 
      t.agent?.name || "", 
      safeDate(t.dueDate), 
      t.status, 
      (t.description || "").replace(/\n/g, " "),
      ...detailKeysList.map(k => {
        const val = t.actionDetails?.[k];
        if (typeof val === 'object') return JSON.stringify(val);
        return val || "";
      })
    ]);

    const csv = [headers, ...rows].map(row => 
      row.map(cell => `"${String(cell || "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `matters_export_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importFromCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split("\n").filter(l => l.trim());
      const headerRow = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase().replace(/\s/g, ""));
      
      let success = 0;
      let failed = 0;

      toast.loading("Importing tasks...", { id: "import-tasks" });

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        const row: any = {};
        headerRow.forEach((h, idx) => { row[h] = values[idx]; });
        
        const title = row.title || row.tasktitle || row.name;
        const type = row.type || row.tasktype || "GENERAL";
        const clientName = row.client || row.clientname;
        const projectName = row.project || row.projectname || row.projectcode;
        const assigneeStr = row.assignees || row.lawyers || row.lawyer;
        const dueDateStr = row.duedate || row.date;

        const client = clients.find(c => c.name.toLowerCase() === clientName?.toLowerCase());
        const project = projects.find(p => p.name.toLowerCase() === projectName?.toLowerCase() || p.label?.toLowerCase().includes(projectName?.toLowerCase()));
        
        const assigneeNames = assigneeStr?.split(";").map((n: string) => n.trim()) || [];
        const assigneeIds = assigneeNames.map((name: string) => lawyers.find(l => l.name.toLowerCase() === name.toLowerCase())?.id).filter(Boolean);
        const agent = row.agent ? agents.find(a => a.name.toLowerCase() === row.agent.toLowerCase()) : null;

        if (title && (client || project)) {
          try {
            const res = await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...buildAuth() },
              body: JSON.stringify({
                title, 
                description: row.description || "", 
                taskType: type.toUpperCase(),
                ipType: row.iptype || null, 
                clientId: client?.id || project?.clientId, 
                projectId: project?.id,
                assigneeIds: assigneeIds.length > 0 ? assigneeIds : undefined, 
                agentId: agent?.id, 
                dueDate: dueDateStr ? new Date(dueDateStr).toISOString() : null,
                isAgent: !!agent,
              }),
            });
            if (res.ok) success++; else failed++;
          } catch { failed++; }
        } else { failed++; }
      }
      
      toast.dismiss("import-tasks");
      toast.success(`Import completed: ${success} success, ${failed} failed.`);
      load();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  if (loading) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-slate-500">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster />

      {/* Import/Export toolbar */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-serif text-white">Matters Management</h1>
        <div className="flex gap-2">
          <a
            href={`/templates/tasks_import_template.csv?v=${Date.now()}`}
            download
            className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-xs text-slate-400 transition-colors"
          >
            Template
          </a>
          <label className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-slate-400 transition-colors">
            <Upload className="w-4 h-4" /> Import CSV
            <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
          </label>
          <button onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-xs text-slate-400 transition-colors">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Category sections */}
      {category === "landing" && (
        <TaskLanding onSelect={setCategory} taskCounts={taskCounts} />
      )}

      {(category === "GENERAL" || category === "CORPORATE") && (
        <GeneralTaskSection
          category={category}
          tasks={tasks}
          clients={clients}
          projects={projects}
          lawyers={lawyers}
          agents={agents}
          onBack={() => setCategory("landing")}
          onCreateTask={createTask}
          onSelectTask={setSelectedTask}
          onUpdateStatus={updateStatus}
        />
      )}

      {category === "LITIGATION" && (
        <LitigationSection
          tasks={tasks}
          clients={clients}
          projects={projects}
          lawyers={lawyers}
          agents={agents}
          onBack={() => setCategory("landing")}
          onCreateTask={createTask}
          onSelectTask={setSelectedTask}
          onUpdateStatus={updateStatus}
        />
      )}

      {category === "IP" && (
        <IPSection
          tasks={tasks}
          clients={clients}
          projects={projects}
          lawyers={lawyers}
          agents={agents}
          onBack={() => setCategory("landing")}
          onCreateTask={createTask}
          onSelectTask={setSelectedTask}
          onUpdateStatus={updateStatus}
        />
      )}

      {/* Task detail modal */}
      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}