"use client";

import { useState, useEffect, useRef } from "react";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
import { Users, Plus, Edit2, Trash2, X, Globe, MapPin, Phone, Mail, FileText, Download, Upload, User, Hash } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  country?: string;
  city?: string;
  address?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  code?: string;
  contactPerson?: string;
  vatCode?: string;
}

const fetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${getAuth()}` } }).then((r) => r.json());

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Agent | null>(null);
  const [saving, setSaving] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: "",
    country: "",
    city: "",
    address: "",
    phone: "",
    email: "",
    taxNumber: "",
    code: "",
    contactPerson: "",
    vatCode: "",
  });

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
    setForm({
      name: "",
      country: "",
      city: "",
      address: "",
      phone: "",
      email: "",
      taxNumber: "",
      code: "",
      contactPerson: "",
      vatCode: "",
    });
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
      code: a.code || "",
      contactPerson: a.contactPerson || "",
      vatCode: a.vatCode || "",
    });
    setShowForm(true);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/agents/import', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${getAuth()}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Imported ${data.count} agents successfully.`);
      if (data.errors > 0) {
        toast.error(`${data.errors} rows failed to import. Check console.`);
      }
      loadAgents();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
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
          <div className="flex items-center gap-2">
            <a
              href={`/templates/agents_import_template.csv?v=${Date.now()}`}
              download
              className="flex items-center gap-2 border border-gray-300 text-gray-700 bg-white px-3 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
              title="Download CSV Template"
            >
              <Download className="w-4 h-4" /> Template
            </a>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv"
            />

            <button
              onClick={handleImportClick}
              disabled={isImporting}
              className="flex items-center gap-2 border border-emerald-300 text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg hover:bg-emerald-100 text-sm font-medium disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {isImporting ? 'Importing...' : 'Import CSV'}
            </button>

            <button onClick={() => { resetForm(); setShowForm(true); }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Agent
            </button>
          </div>
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-gray-900">{a.name}</h3>
                      {a.code && <span className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-1.5 py-0.5 rounded font-mono font-medium">{a.code}</span>}
                    </div>
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
                  {a.contactPerson && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="w-4 h-4" /> {a.contactPerson}
                    </div>
                  )}
                  {a.email && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4" /> {a.email}
                    </div>
                  )}
                  {a.phone && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" /> {a.phone}
                    </div>
                  )}
                  {a.address && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" /> {a.address}
                      {a.city && <span>, {a.city}</span>}
                    </div>
                  )}
                  {!a.address && a.city && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="w-4 h-4" /> {a.city}
                      {a.country && <span>, {a.country}</span>}
                    </div>
                  )}
                  {a.address && !a.city && a.country && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" /> {a.country}
                    </div>
                  )}
                  {!a.address && !a.city && a.country && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Globe className="w-4 h-4" /> {a.country}
                    </div>
                  )}
                  {a.vatCode && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <FileText className="w-4 h-4" /> VAT: {a.vatCode}
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="Agent name" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Code</label>
                    <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="e.g. AG001" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contact Person</label>
                  <input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                    className="w-full border rounded-lg px-3 py-2" placeholder="Contact Person" />
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tax Number</label>
                    <input value={form.taxNumber} onChange={(e) => setForm({ ...form, taxNumber: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="Tax ID" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">VAT Code</label>
                    <input value={form.vatCode} onChange={(e) => setForm({ ...form, vatCode: e.target.value })}
                      className="w-full border rounded-lg px-3 py-2" placeholder="VAT Code" />
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