"use client";
import { useEffect, useState, useMemo } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
import { Download, Filter, Upload } from "lucide-react";
import { COUNTRIES, ACTION_FIELDS } from "@/lib/countries";
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
  taskType?: string;
  ipType?: string;
  ipAction?: string;
  isAgent: boolean;
  agent?: { id: number; name: string } | null;
  defendantName?: string;
  opponent?: string;
  court?: string;
  client?: { id: number; name: string } | null;
  project?: { id: number; name: string } | null;
  assignees: { id: number; name: string }[];
}

const IP_TYPES = ["TRADEMARK", "PATENT", "INDUSTRIAL_DESIGN", "PLANT_VARIETY", "COPYRIGHT", "SOFTWARE", "ENFORCEMENT"] as const;

const IP_ACTIONS_BY_TYPE: Record<string, string[]> = {
  TRADEMARK: [
    "Trademark search", "Clearance opinion", "Application preparation", 
    "Application filing", "Office action response", "Publication monitoring",
    "Opposition filing", "Opposition defense", "Registration", 
    "Renewal", "Recordal (assignment / license / change)",
    "Coexistence agreement", "Trademark watch", "Infringement review",
    "Cease & desist", "Customs recordal", "Cancellation / petition", "Appeal (before the trademark office)"
  ],
  PATENT: [
    "Patentability search", "Prior art search", "Patent drafting", 
    "Application preparation", "Application filing", "Formal examination response",
    "Substantive examination response", "Amendment filing", "Grant processing",
    "Validation (for regional patents)", "Annuity / maintenance fee payment",
    "Recordal (assignment / license)", "Patent watch", 
    "Freedom-to-operate analysis", "Patent infringement analysis",
    "Patent opposition", "Revocation action", "Appeal"
  ],
  INDUSTRIAL_DESIGN: [
    "Design search", "Filing preparation", "Application filing",
    "Office action response", "Publication monitoring", "Registration processing",
    "Renewal", "Recordal (assignment / license / change)", 
    "Design watch", "Infringement assessment"
  ],
  PLANT_VARIETY: [
    "Plant variety search", "Application preparation", "Filing application",
    "Office action response", "Grant processing", "Renewal", "Recordal"
  ],
  COPYRIGHT: [
    "Copyright advisory", "Ownership verification", "Copyright registration",
    "Recordal (assignment / license)", "Copyright notice / documentation",
    "Copyright monitoring", "Infringement assessment", "Takedown request"
  ],
  SOFTWARE: [
    "Software search", "Clearance opinion", "Application preparation",
    "Application filing", "Office action response", "Registration processing",
    "Renewal", "Recordal", "Infringement analysis"
  ],
  ENFORCEMENT: [
    "Investigation request", "Evidence collection", "Market investigation",
    "Online monitoring", "Test purchase", "Infringement analysis",
    "Cease & desist", "Settlement negotiation", "Complaint"
  ]
};

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    taskType: "",
    ipType: "",
    clientId: "",
    projectId: "",
    assigneeId: "",
    agentId: "",
  });
  const IP_ACTIONS = ["Filing", "Petition", "Opposition", "Assignment", "Renewal", "Inscription/Amendment"] as const;

  const [form, setForm] = useState({
    title: "",
    description: "",
    taskType: "",
    ipType: "",
    ipAction: "",
    actionDetails: {} as Record<string, any>,
    isAgent: false,
    agentId: "",
    defendantName: "",
    opponent: "",
    court: "",
    assigneeIds: [] as number[],
    dueDate: "",
    clientId: "",
    projectId: "",
  });

  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: number; name: string; clientId: number }[]>([]);
  const [lawyers, setLawyers] = useState<{ id: number; name: string }[]>([]);
  const [agents, setAgents] = useState<{ id: number; name: string }[]>([]);

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
      .then((r) => r.json())
      .then(setTasks)
      .catch(() => toast.error("Error"))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      if (filters.status && t.status !== filters.status) return false;
      if (filters.taskType && t.taskType !== filters.taskType) return false;
      if (filters.ipType && t.ipType !== filters.ipType) return false;
      if (filters.clientId && t.client?.id !== Number(filters.clientId)) return false;
      if (filters.projectId && t.project?.id !== Number(filters.projectId)) return false;
      if (filters.assigneeId && !t.assignees?.some(a => a.id === Number(filters.assigneeId))) return false;
      if (filters.agentId && t.agent?.id !== Number(filters.agentId)) return false;
      return true;
    });
  }, [tasks, filters]);

  const exportToExcel = () => {
    const headers = ["Title", "Type", "IP Type", "Client", "Project", "Assignees", "Agent", "Due Date", "Status", "Description", "Defendant", "Opponent", "Court", "Created At"];
    const rows = filteredTasks.map(t => [
      t.title,
      t.taskType || "",
      t.ipType || "",
      t.client?.name || "",
      t.project?.name || "",
      t.assignees?.map(a => a.name).join(", ") || "",
      t.agent?.name || "",
      new Date(t.dueDate).toLocaleDateString(),
      t.status,
      t.description || "",
      t.defendantName || "",
      t.opponent || "",
      t.court || "",
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : "",
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
        const assigneeIds = assigneeNames.map((name: string) => {
          const lawyer = lawyers.find(l => l.name === name);
          return lawyer?.id;
        }).filter(Boolean);
        
        const agent = row.Agent ? agents.find(a => a.name === row.Agent) : null;
        
        if (row.Title && assigneeIds.length > 0 && row["Due Date"]) {
          try {
            await fetch("/api/tasks", {
              method: "POST",
              headers: { "Content-Type": "application/json", ...buildAuth() },
              body: JSON.stringify({
                title: row.Title,
                description: row.Description,
                taskType: row.Type || null,
                ipType: row["IP Type"] || null,
                clientId: client?.id,
                projectId: project?.id,
                assigneeIds,
                agentId: agent?.id,
                dueDate: new Date(row["Due Date"]).toISOString(),
                isAgent: !!agent,
                defendantName: row.Defendant || null,
                opponent: row.Opponent || null,
                court: row.Court || null,
              }),
            });
          } catch (err) {
            console.error("Import error:", err);
          }
        }
      }
      toast.success("Import completed");
      load();
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const clearFilters = () => {
    setFilters({ status: "", taskType: "", ipType: "", clientId: "", projectId: "", assigneeId: "", agentId: "" });
  };

  const addTask = async () => {
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...buildAuth() },
        body: JSON.stringify({
          ...form,
          assigneeIds: form.assigneeIds,
          clientId: form.clientId ? parseInt(form.clientId) : undefined,
          projectId: form.projectId ? parseInt(form.projectId) : undefined,
          agentId: form.isAgent && form.agentId ? parseInt(form.agentId) : undefined,
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
        title: "", description: "", taskType: "", ipType: "", ipAction: "", isAgent: false, agentId: "",
        defendantName: "", opponent: "", court: "", assigneeIds: [], dueDate: "", clientId: "", projectId: ""
      });
      load();
    } catch (err:any) {
      toast.error(err.message || "Creation failed");
    }
  };

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
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: updated.status } : t));
      toast.success('Updated');
    } catch (e:any) {
      toast.error(e.message || 'Update failed');
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Toaster />
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex gap-2">
          <button onClick={()=>setShowFilters(!showFilters)} className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
            <Filter className="w-4 h-4" /> Filters
          </button>
          <label className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50 cursor-pointer">
            <Upload className="w-4 h-4" /> Import
            <input type="file" accept=".csv" onChange={importFromCSV} className="hidden" />
          </label>
          <button onClick={exportToExcel} className="flex items-center gap-2 px-3 py-2 border rounded hover:bg-gray-50">
            <Download className="w-4 h-4" /> Export
          </button>
        </div>
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <button onClick={()=>setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Add Task</button>
      </div>

      {showFilters && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })} className="border p-2 rounded">
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
          <select value={filters.taskType} onChange={e => setFilters({ ...filters, taskType: e.target.value, ipType: "" })} className="border p-2 rounded">
            <option value="">All Types</option>
            <option value="CORPORATE">Corporate</option>
            <option value="IP">IP</option>
            <option value="LITIGATION">Litigation</option>
          </select>
          {filters.taskType === "IP" && (
            <select value={filters.ipType} onChange={e => setFilters({ ...filters, ipType: e.target.value })} className="border p-2 rounded">
              <option value="">All IP Types</option>
              <option value="TRADEMARK">Trademark</option>
              <option value="PATENT">Patent</option>
              <option value="INDUSTRIAL_DESIGN">Industrial Design</option>
              <option value="PLANT_VARIETY">Plant Variety</option>
              <option value="COPYRIGHT">Copyright</option>
              <option value="SOFTWARE">Software</option>
              <option value="ENFORCEMENT">Enforcement</option>
            </select>
          )}
          <select value={filters.clientId} onChange={e => setFilters({ ...filters, clientId: e.target.value, projectId: "" })} className="border p-2 rounded">
            <option value="">All Clients</option>
            {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={filters.projectId} onChange={e => setFilters({ ...filters, projectId: e.target.value })} className="border p-2 rounded" disabled={!filters.clientId}>
            <option value="">All Projects</option>
            {projects.filter(p => !filters.clientId || p.clientId === Number(filters.clientId)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={filters.assigneeId} onChange={e => setFilters({ ...filters, assigneeId: e.target.value })} className="border p-2 rounded">
            <option value="">All Lawyers</option>
            {lawyers.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
          <select value={filters.agentId} onChange={e => setFilters({ ...filters, agentId: e.target.value })} className="border p-2 rounded">
            <option value="">All Agents</option>
            {agents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
          <button onClick={clearFilters} className="text-blue-600 hover:underline text-sm">Clear Filters</button>
        </div>
      )}

      {(loading || filteredTasks.length !== tasks.length) && (
        <p className="text-sm text-gray-500 mb-2">
          {loading ? "Loading..." : `Showing ${filteredTasks.length} of ${tasks.length} tasks`}
        </p>
      )}
        <div className="overflow-x-auto border rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                {["Title","Type","Client","Project","Assignee","Due Date","Status","Actions"].map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTasks.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{t.title}</td>
                  <td className="px-3 py-2 capitalize">{t.taskType?.toLowerCase() || "-"}</td>
                  <td className="px-3 py-2">{t.client?.name || "-"}</td>
                  <td className="px-3 py-2">{t.project?.name || "-"}</td>
                  <td className="px-3 py-2">{t.assignees?.map(a => a.name).join(", ") || "-"}</td>
                  <td className="px-3 py-2">{new Date(t.dueDate).toLocaleDateString()}</td>
                  <td className="px-3 py-2 capitalize">{t.status.toLowerCase()}</td>
                  <td className="px-3 py-2 space-x-2">
                    {t.status === 'PENDING' && (
                      <button className="text-blue-600 hover:underline" onClick={() => updateStatus(t.id,'IN_PROGRESS')}>Start</button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <button className="text-green-600 hover:underline" onClick={() => updateStatus(t.id,'DONE')}>Done</button>
                    )}
                    <button className="text-indigo-600 hover:underline" onClick={() => reassign(t)}>Assign</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-lg p-6 m-4">
            <h2 className="text-xl font-semibold mb-4">Add Task</h2>
            <div className="space-y-3">
              <select
                className="w-full border p-2"
                value={form.taskType}
                onChange={e => setForm({ ...form, taskType: e.target.value, ipType: "" })}
              >
                <option value="">Select Task Type</option>
                <option value="CORPORATE">Corporate</option>
                <option value="IP">IP</option>
                <option value="LITIGATION">Litigation</option>
              </select>

              {form.taskType === "IP" && (
                <>
                  <select
                    className="w-full border p-2"
                    value={form.ipType}
                    onChange={e => setForm({ ...form, ipType: e.target.value })}
                  >
                    <option value="">Select IP Type</option>
                    {IP_TYPES.map(t => (
                      <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                  {form.ipType && (
                    <select
                      className="w-full border p-2"
                      value={form.ipAction}
                      onChange={e => setForm({ ...form, ipAction: e.target.value, actionDetails: {} })}
                    >
                      <option value="">Select Action</option>
                      {(IP_ACTIONS_BY_TYPE[form.ipType] || []).map(a => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  )}
                  {form.ipAction && ACTION_FIELDS[form.ipAction] && (
                    <div className="border p-3 rounded mt-2 space-y-3">
                      <p className="font-medium text-sm text-gray-700">{form.ipAction} Details</p>
                      {ACTION_FIELDS[form.ipAction].map(field => {
                        const shouldShow = !field.dependsOn || form.actionDetails[field.dependsOn.field] === field.dependsOn.value;
                        if (!shouldShow) return null;
                        return (
                        <div key={field.name}>
                          {field.type === "select" && (
                            <select
                              className="w-full border p-2 text-sm"
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}
                            >
                              <option value="">{field.label}</option>
                              {field.options?.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                              ))}
                            </select>
                          )}
                          {field.type === "text" && (
                            <input
                              type="text"
                              className="w-full border p-2 text-sm"
                              placeholder={field.label}
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}
                            />
                          )}
                          {field.type === "date" && (
                            <input
                              type="date"
                              className="w-full border p-2 text-sm"
                              placeholder={field.label}
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}
                            />
                          )}
                          {field.type === "textarea" && (
                            <textarea
                              className="w-full border p-2 text-sm"
                              placeholder={field.label}
                              rows={2}
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}
                            />
                          )}
                          {field.type === "number" && (
                            <input
                              type="number"
                              className="w-full border p-2 text-sm"
                              placeholder={field.label}
                              value={form.actionDetails[field.name] || ""}
                              onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.value } })}
                            />
                          )}
                          {field.type === "boolean" && (
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id={`${field.name}-${form.ipAction}`}
                                checked={form.actionDetails[field.name] || false}
                                onChange={e => setForm({ ...form, actionDetails: { ...form.actionDetails, [field.name]: e.target.checked } })}
                              />
                              <label htmlFor={`${field.name}-${form.ipAction}`} className="text-sm">{field.label}</label>
                            </div>
                          )}
                          {field.type === "file" && (
                            <div>
                              <label className="block text-sm text-gray-600 mb-1">{field.label}</label>
                              <input type="file" className="w-full border p-2 text-sm" />
                            </div>
                          )}
                        </div>
                      );
                      })}
                    </div>
                  )}
                </>
              )}

              <input
                className="w-full border p-2"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
              <textarea
                className="w-full border p-2"
                placeholder="Description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              ></textarea>

              {form.taskType && form.taskType !== "" && (
                <>
                  <select
                    className="w-full border p-2"
                    value={form.clientId}
                    onChange={e => setForm({ ...form, clientId: e.target.value, projectId: '' })}
                  >
                    <option value="">Select Client</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <select
                    className="w-full border p-2"
                    value={form.projectId}
                    onChange={e => setForm({ ...form, projectId: e.target.value })}
                    disabled={!form.clientId}
                  >
                    <option value="">Select Project</option>
                    {projects.filter(p => !form.clientId || p.clientId === parseInt(form.clientId)).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </>
              )}

              {form.taskType === "LITIGATION" && (
                <>
                  <input
                    className="w-full border p-2"
                    placeholder="Defendant Name"
                    value={form.defendantName}
                    onChange={(e) => setForm({ ...form, defendantName: e.target.value })}
                  />
                  <input
                    className="w-full border p-2"
                    placeholder="Opponent"
                    value={form.opponent}
                    onChange={(e) => setForm({ ...form, opponent: e.target.value })}
                  />
                  <input
                    className="w-full border p-2"
                    placeholder="Court"
                    value={form.court}
                    onChange={(e) => setForm({ ...form, court: e.target.value })}
                  />
                </>
              )}

              <div className="border p-2 rounded max-h-40 overflow-y-auto">
                <p className="text-sm font-medium mb-2">Select Lawyers</p>
                {lawyers.map(l => (
                  <div key={l.id} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id={`lawyer-${l.id}`}
                      checked={form.assigneeIds.includes(l.id)}
                      onChange={e => {
                        if (e.target.checked) {
                          setForm({ ...form, assigneeIds: [...form.assigneeIds, l.id] });
                        } else {
                          setForm({ ...form, assigneeIds: form.assigneeIds.filter(id => id !== l.id) });
                        }
                      }}
                    />
                    <label htmlFor={`lawyer-${l.id}`}>{l.name}</label>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isAgent"
                  checked={form.isAgent}
                  onChange={e => setForm({ ...form, isAgent: e.target.checked, agentId: "" })}
                />
                <label htmlFor="isAgent">Assign to Agent?</label>
              </div>
              {form.isAgent && (
                <select
                  className="w-full border p-2"
                  value={form.agentId}
                  onChange={e => setForm({ ...form, agentId: e.target.value })}
                >
                  <option value="">Select Agent</option>
                  {agents.map(a => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              )}

              <input
                type="date"
                className="w-full border p-2"
                value={form.dueDate}
                onChange={e => setForm({ ...form, dueDate: e.target.value })}
              />
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <button onClick={() => setShowModal(false)} className="px-4 py-2 border rounded">Cancel</button>
              <button
                onClick={addTask}
                disabled={!form.title.trim() || form.assigneeIds.length === 0 || !form.dueDate}
                className="px-4 py-2 rounded text-white disabled:opacity-50"
                style={{backgroundColor: (!form.title.trim() || !form.assigneeId || !form.dueDate) ? '#94a3b8':'#2563eb'}}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}