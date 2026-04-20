"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
import { Users, Plus, Edit2, Trash2, X, Globe, MapPin, Phone, Mail, FileText } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  clientId?: number;
  projectId?: number;
  client?: { id: number; name: string };
  project?: { id: number; name: string };
}

interface Client { id: number; name: string }
interface Project { id: number; name: string }

const fetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${getAuth()}` } }).then((r) => r.json());

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    taxNumber: "",
    clientId: "",
    projectId: "",
  });

  const { data: clients } = useSWR<Client[]>("/api/list/clients", fetcher);
  const { data: projects } = useSWR<Project[]>("/api/list/projects", fetcher);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/agents", { headers: { Authorization: `Bearer ${getAuth()}` } });
      if (res.ok) setAgents(await res.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const resetForm = () => {
    setForm({ name: "", country: "", city: "", address: "", phone: "", email: "", taxNumber: "", clientId: "", projectId: "" });
    setEditing(null);
  };

  const openEdit = (a: Agent) => {
    setEditing(a);
    setForm({
      name: a.name,
      country: a.country || "",
      city: a.city || "",
      address: a.address || "",
      phone: a.phone || "",
      email: a.email || "",
      taxNumber: a.taxNumber || "",
      clientId: a.clientId?.toString() || "",
      projectId: a.projectId?.toString() || "",
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!form.name) return toast.error("Name is required");
    setSaving(true);
    try {
      const url = editing ? `/api/agents/${editing.id}` : "/api/agents";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuth()}` },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Updated" : "Created");
      setShowForm(false);
      resetForm();
      loadAgents();
    } catch { toast.error("Failed to save"); }
    finally { setSaving(false); }
  };

  const handleDelete = async (a: Agent) => {
    if (!window.confirm(`Delete agent "${a.name}"?`)) return;
    try {
      await fetch(`/api/agents/${a.id}`, { method: "DELETE", headers: { Authorization: `Bearer ${getAuth()}` } });
      toast.success("Deleted");
      loadAgents();
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster position="top-right" />
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
              <p className="text-sm text-gray-500">External agents / representatives</p>
            </div>
          </div>
          <button onClick={() => { resetForm(); setShowForm(true); }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Add Agent
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : agents.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">No agents yet. Add your first agent.</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents.map((a) => (
              <div key={a.id} className="bg-white rounded-xl border shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{a.name}</h3>
                    {a.client && <p className="text-sm text-gray-500">Client: {a.client.name}</p>}
                    {a.project && <p className="text-sm text-gray-500">Project: {a.project.name}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDelete(a)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {a.country && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" /> {a.country}
                      {a.city && <span>, {a.city}</span>}
                    </div>
                  )}
                  {a.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" /> {a.address}
                    </div>
                  )}
                  {a.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" /> {a.phone}
                    </div>
                  )}
                  {a.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" /> {a.email}
                    </div>
                  )}
                  {a.taxNumber && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" /> Tax: {a.taxNumber}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b">
                <h2 className="text-lg font-semibold">{editing ? "Edit Agent" : "Add Agent"}</h2>
                <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" placeholder="Agent name" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="Country" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="City" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" placeholder="Full address" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="Phone" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email"
                      className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number (الرقم الضريبي)</label>
                  <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" placeholder="Tax ID" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                    <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2">
                      <option value="">Select Client</option>
                      {Array.isArray(clients) && clients.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Project</label>
                    <select value={form.projectId} onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2">
                      <option value="">Select Project</option>
                      {Array.isArray(projects) && projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t">
                <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
                <button onClick={save} disabled={saving}
                  className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
                  {saving ? "Saving..." : editing ? "Update" : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}