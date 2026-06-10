"use client";

import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Users, Shield, Plus, Edit, Trash2, Key, X, Loader2 } from "lucide-react";
import PermissionsDrawer from "./PermissionsDrawer";

interface Position {
  id: number;
  name: string;
}

const ROLES = [
  { value: "ADMIN", label: "Admin" },
  { value: "ACCOUNTANT_MASTER", label: "Accountant Master" },
  { value: "ACCOUNTANT_ASSISTANT", label: "Accountant Assistant" },
  { value: "LAWYER_PARTNER", label: "Lawyer Partner" },
  { value: "LAWYER_MANAGER", label: "Lawyer Manager" },
  { value: "LAWYER", label: "Lawyer" },
  { value: "HR_MANAGER", label: "HR Manager" },
  { value: "HR", label: "HR" },
];

interface Lawyer {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  position?: Position | null;
  role: string;
}

export default function LawyersPage() {
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

  // Add form states
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [positionId, setPositionId] = useState<number | "">("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<string>("LAWYER");
  const [managedIds, setManagedIds] = useState<number[]>([]);

  // Edit modal states
  const [editing, setEditing] = useState<Lawyer | null>(null);
  const [editData, setEditData] = useState<any>({});
  const [editManagedIds, setEditManagedIds] = useState<number[]>([]);

  // Permissions drawer state
  const [permissionsUser, setPermissionsUser] = useState<number | null>(null);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const [lwRes, posRes] = await Promise.all([fetch("/api/lawyers"), fetch("/api/positions")]);
      if (lwRes.ok) setLawyers(await lwRes.json());
      if (posRes.ok) setPositions(await posRes.json());
    } catch (err) {
      console.error(err);
      toast.error("Failed to load users data");
    } finally {
      setLoading(false);
    }
  }

  async function addLawyer(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !password) return toast.error("Name, Email, Password required");
    try {
      const res = await fetch("/api/lawyers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          positionId: positionId || undefined,
          phone,
          address,
          password,
          role,
          managedLawyerIds: role === 'LAWYER_MANAGER' ? managedIds : undefined
        }),
      });
      if (res.ok) {
        toast.success("User added successfully!");
        setName("");
        setEmail("");
        setPhone("");
        setAddress("");
        setPassword("");
        setPositionId("");
        setRole("LAWYER");
        setManagedIds([]);
        setShowAddModal(false);
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to add user");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  function openEdit(l: Lawyer) {
    setEditing(l);
    setEditData({
      name: l.name,
      email: l.email,
      phone: l.phone ?? "",
      address: l.address ?? "",
      positionId: l.position?.id ?? "",
      role: l.role ?? "LAWYER",
      password: "",
    });
    setEditManagedIds([]);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    try {
      const res = await fetch(`/api/lawyers/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editData,
          managedLawyerIds: editData.role === 'LAWYER_MANAGER' ? editManagedIds : undefined
        }),
      });
      if (res.ok) {
        toast.success("User details updated successfully!");
        setEditing(null);
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to save updates");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  async function deleteLawyer(id: number) {
    if (!confirm("Are you sure you want to delete this user account?")) return;
    try {
      const res = await fetch(`/api/lawyers/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("User deleted successfully!");
        setEditing(null);
        fetchAll();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to delete user");
      }
    } catch (err) {
      toast.error("Network error");
    }
  }

  function MultiSelectDropdown({selected, setSelected, options}:{selected:number[]; setSelected:(ids:number[])=>void; options:Lawyer[]}){
    const [open,setOpen]=useState(false);
    function toggle(id:number){
      if(selected.includes(id)) setSelected(selected.filter(x=>x!==id));
      else setSelected([...selected,id]);
    }
    return (
      <div className="relative w-full">
        <button
          type="button"
          onClick={()=>setOpen(!open)}
          className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs text-left text-slate-300 flex justify-between items-center"
        >
          <span>{selected.length ? `${selected.length} Selected` : 'Select Lawyers'}</span>
          <span className="text-[10px] text-slate-500 font-sans">▼</span>
        </button>
        {open && (
          <div className="absolute z-[999] bg-[#0b101d] border border-white/10 rounded-lg mt-1 w-full max-h-48 overflow-y-auto shadow-2xl p-2 space-y-1">
            {options.map(opt=> (
              <label key={opt.id} className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-md cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.id)}
                  onChange={()=>toggle(opt.id)}
                  className="rounded border-white/10 bg-[#070b13] text-[#C5A059] focus:ring-0"
                />
                <span>{opt.name}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] text-slate-100 font-sans p-6 md:p-10">
      <Toaster position="top-right" reverseOrder={false} />

      <header className="mb-8 border-b border-white/5 pb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white tracking-wide">Users & Permissions</h1>
          <p className="text-slate-400 text-xs mt-1">Manage system user logins, roles, and assign explicit feature permissions.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-legal px-4 py-2.5 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase flex items-center gap-2 transition-all self-start"
        >
          <Plus className="w-4 h-4" /> Add User
        </button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center h-[300px]">
          <Loader2 className="w-8 h-8 text-[#C5A059] animate-spin" />
        </div>
      ) : (
        <div className="bg-[#0b101d] rounded-xl border border-white/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead className="bg-[#070b13] border-b border-white/5 text-[10px] uppercase font-bold tracking-widest text-[#C5A059]">
                <tr>
                  <th className="px-6 py-4">ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Phone</th>
                  <th className="px-6 py-4">Position</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {lawyers.map((l) => (
                  <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{l.id}</td>
                    <td className="px-6 py-4 font-medium text-white">{l.name}</td>
                    <td className="px-6 py-4 text-slate-300">{l.email}</td>
                    <td className="px-6 py-4 text-slate-400">{l.phone ?? "—"}</td>
                    <td className="px-6 py-4 text-slate-300">{l.position?.name ?? "—"}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold tracking-wider bg-white/5 border border-white/5 text-slate-300">
                        {l.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                      <button
                        onClick={() => openEdit(l)}
                        className="px-2.5 py-1.5 rounded bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 text-slate-300 hover:text-white transition-all text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => setPermissionsUser(l.id)}
                        className="px-2.5 py-1.5 rounded bg-amber-500/5 border border-amber-500/10 hover:bg-amber-500/15 hover:border-amber-500/20 text-amber-400 hover:text-amber-300 transition-all text-xs font-bold inline-flex items-center gap-1.5"
                      >
                        <Key className="w-3.5 h-3.5" /> Permissions
                      </button>
                    </td>
                  </tr>
                ))}
                {lawyers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-xs">
                      No users found. Create one using the button above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Permissions slide-out drawer wrapper */}
      <PermissionsDrawer
        lawyerId={permissionsUser}
        open={permissionsUser !== null}
        onClose={() => setPermissionsUser(null)}
      />

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-[#0b101d] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-[#070b13] px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Add New User</h3>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={addLawyer} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Home Address</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Position</label>
                  <select
                    value={positionId}
                    onChange={(e) => setPositionId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  >
                    <option value="">None</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {role === 'LAWYER_MANAGER' && (
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Managed Lawyers</label>
                    <MultiSelectDropdown
                      selected={managedIds}
                      setSelected={setManagedIds}
                      options={lawyers.filter(l => l.role !== 'LAWYER_MANAGER')}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-white/5">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] overflow-y-auto">
          <div className="bg-[#0b101d] border border-white/10 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between bg-[#070b13] px-6 py-4 border-b border-white/5">
              <h3 className="font-bold text-white text-sm uppercase tracking-wider">Edit User: {editing.name}</h3>
              <button onClick={() => setEditing(null)} className="p-1 hover:bg-white/5 rounded-full text-slate-400 hover:text-white transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={saveEdit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editData.name || ""}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editData.email || ""}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editData.phone || ""}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Home Address</label>
                  <input
                    type="text"
                    value={editData.address || ""}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Job Position</label>
                  <select
                    value={editData.positionId || ""}
                    onChange={(e) => setEditData({ ...editData, positionId: e.target.value ? Number(e.target.value) : "" })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  >
                    <option value="">None</option>
                    {positions.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">System Role</label>
                  <select
                    value={editData.role || "LAWYER"}
                    onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  >
                    {ROLES.map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </select>
                </div>
                {editData.role === 'LAWYER_MANAGER' && (
                  <div className="col-span-2">
                    <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Managed Lawyers</label>
                    <MultiSelectDropdown
                      selected={editManagedIds}
                      setSelected={setEditManagedIds}
                      options={lawyers.filter(l => l.id !== editing?.id && l.role !== 'LAWYER_MANAGER')}
                    />
                  </div>
                )}
                <div className="col-span-2">
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">New Password (Leave blank to keep current)</label>
                  <input
                    type="password"
                    placeholder="Enter new password if changing"
                    value={editData.password || ""}
                    onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                    className="w-full bg-[#070b13] border border-white/10 rounded-lg px-4 py-2 text-xs focus:outline-none focus:border-[#C5A059] text-white"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => deleteLawyer(editing.id)}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete User
                </button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setEditing(null)} className="px-5 py-2 border border-slate-700 hover:border-slate-500 rounded-lg text-xs font-bold text-slate-300 hover:text-white transition-all">
                    Cancel
                  </button>
                  <button type="submit" className="px-5 py-2 bg-[#C5A059] hover:bg-[#d4b06a] text-slate-900 font-bold rounded-lg text-xs tracking-wider uppercase transition-all">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
