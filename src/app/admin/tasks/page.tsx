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
  try { return JSON.parse(atob(t.split('.')[1])).companyId; } catch { return undefined; }
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
    tasks.forEach(t => {
      const type = t.taskType || "GENERAL";
      if (counts[type] !== undefined) counts[type]++;
    });
    return counts;
  }, [tasks]);

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
    const headers = ["Title", "Type", "IP Type", "Client", "Project", "Assignees", "Agent", "Due Date", "Status", "Description"];
    const rows = tasks.map(t => [
      t.title, t.taskType || "", t.ipType || "", t.client?.name || "", t.project?.name || "",
      t.assignees?.map(a => a.name).join(", ") || "", t.agent?.name || "",
      new Date(t.dueDate).toLocaleDateString(), t.status, t.description || "",
    ]);
    const csv = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_${new Date().toISOString().split("T")[0]}.csv`;
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
      const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",").map(v => v.replace(/"/g, "").trim());
        const row: any = {};
        headers.forEach((h, idx) => { row[h] = values[idx]; });
        const client = clients.find(c => c.name === row.Client);
        const project = projects.find(p => p.name === row.Project);
        const assigneeNames = row.Assignees?.split(";").map((n: string) => n.trim()) || [];
        const assigneeIds = assigneeNames.map((name: string) => lawyers.find(l => l.name === name)?.id).filter(Boolean);
        const agent = row.Agent ? agents.find(a => a.name === row.Agent) : null;
        if (row.Title && assigneeIds.length > 0 && row["Due Date"]) {
          try {
            await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...buildAuth() },
              body: JSON.stringify({
                title: row.Title, description: row.Description, taskType: row.Type || null,
                ipType: row["IP Type"] || null, clientId: client?.id, projectId: project?.id,
                assigneeIds, agentId: agent?.id, dueDate: new Date(row["Due Date"]).toISOString(),
                isAgent: !!agent,
              }),
            });
          } catch {}
        }
      }
      toast.success("Import completed");
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

      {/* Import/Export toolbar - only on landing */}
      {category === "landing" && (
        <div className="flex justify-end gap-2 mb-4">
          <label className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5 cursor-pointer text-sm text-slate-400 transition-colors">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
          </label>
          <button onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-2 border border-white/10 rounded-lg hover:bg-white/5 text-sm text-slate-400 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
      )}

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