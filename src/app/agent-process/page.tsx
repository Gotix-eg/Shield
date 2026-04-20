"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import toast, { Toaster } from "react-hot-toast";
import { getAuth } from "@/lib/auth";
import { Users, Briefcase, DollarSign, Clock, CheckCircle, XCircle, Plus, ArrowRight } from "lucide-react";

interface Agent {
  id: number;
  name: string;
  country?: string;
  city?: string;
}

interface Project {
  id: number;
  name: string;
  agentStatus?: string;
  agentNotes?: string;
  agentCurrency?: string;
  clientInvoiceAmount?: number;
  agentFees?: number;
  agentPaid?: number;
  client?: { name: string };
}

function getCompanyId(): number | undefined {
  const t = getAuth();
  if (!t) return undefined;
  try {
    return JSON.parse(atob(t.split('.')[1])).companyId;
  } catch {
    return undefined;
  }
}

const fetcher = (url: string) =>
  fetch(url, { headers: { Authorization: `Bearer ${getAuth()}` } }).then((r) => r.json());

export default function AgentProcessPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Close project modal
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closingProject, setClosingProject] = useState<Project | null>(null);
  const [invoiceAmount, setInvoiceAmount] = useState("");
  const [agentFees, setAgentFees] = useState("");
  const [clientWillPay, setClientWillPay] = useState(false);

  // Status edit modal
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusProject, setStatusProject] = useState<Project | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  // Payment modal
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentProject, setPaymentProject] = useState<Project | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");

  useEffect(() => {
    fetch("/api/agents", { headers: { Authorization: `Bearer ${getAuth()}` } })
      .then(r => r.json())
      .then(data => {
        setAgents(Array.isArray(data) ? data : []);
        if (data.length > 0) setSelectedAgent(data[0].id);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedAgent) {
      setProjects([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    fetch(`/api/projects?agentId=${selectedAgent}`, { headers: { Authorization: `Bearer ${getAuth()}` } })
      .then(r => r.json())
      .then(data => {
        setProjects(Array.isArray(data) ? data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [selectedAgent]);

  const saveStatus = async () => {
    if (!statusProject) return;
    try {
      const res = await fetch(`/api/projects/${statusProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuth()}` },
        body: JSON.stringify({ 
          agentStatus: newStatus,
          agentNotes: statusNotes
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Status updated");
      setShowStatusModal(false);
      setStatusProject(null);
      setNewStatus("");
      setStatusNotes("");
      // Refresh
      const updated = await fetch(`/api/projects?agentId=${selectedAgent}`, { headers: { Authorization: `Bearer ${getAuth()}` } }).then(r => r.json());
      setProjects(Array.isArray(updated) ? updated : []);
    } catch {
      toast.error("Failed to update");
    }
  };

  const openStatusEdit = (p: Project) => {
    setStatusProject(p);
    setNewStatus(p.agentStatus || "OPEN");
    setStatusNotes(p.agentNotes || "");
    setShowStatusModal(true);
  };

  const updateStatus = async (projectId: number, status: string) => {
      const updated = await fetch(`/api/projects?agentId=${selectedAgent}`, { headers: { Authorization: `Bearer ${getAuth()}` } }).then(r => r.json());
      setProjects(Array.isArray(updated) ? updated : []);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const closeProject = async () => {
    if (!closingProject) return;
    try {
      const totalAmount = parseFloat(invoiceAmount) || 0;
      const fees = parseFloat(agentFees) || 0;
      
      const res = await fetch(`/api/projects/${closingProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuth()}` },
        body: JSON.stringify({
          agentStatus: "CLOSED",
          clientInvoiceAmount: totalAmount,
          agentFees: fees,
          clientWillPay,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Project closed");
      setShowCloseModal(false);
      setClosingProject(null);
      setInvoiceAmount("");
      setAgentFees("");
      setClientWillPay(false);
      
      // Refresh
      const updated = await fetch(`/api/projects?agentId=${selectedAgent}`, { headers: { Authorization: `Bearer ${getAuth()}` } }).then(r => r.json());
      setProjects(Array.isArray(updated) ? updated : []);
    } catch {
      toast.error("Failed to close project");
    }
  };

  const payAgent = async () => {
    if (!paymentProject) return;
    try {
      const amount = parseFloat(paymentAmount) || 0;
      const currentPaid = paymentProject.agentPaid || 0;
      
      const res = await fetch(`/api/projects/${paymentProject.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getAuth()}` },
        body: JSON.stringify({ agentPaid: currentPaid + amount }),
      });
      if (!res.ok) throw new Error();
      toast.success("Payment recorded");
      setShowPaymentModal(false);
      setPaymentProject(null);
      setPaymentAmount("");
      
      // Refresh
      const updated = await fetch(`/api/projects?agentId=${selectedAgent}`, { headers: { Authorization: `Bearer ${getAuth()}` } }).then(r => r.json());
      setProjects(Array.isArray(updated) ? updated : []);
    } catch {
      toast.error("Failed to record payment");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OPEN": return "bg-blue-100 text-blue-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "CLOSED": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const selectedAgentData = agents.find(a => a.id === selectedAgent);
  const agentProjects = projects.filter(p => p.agentStatus !== "CLOSED");
  const closedProjects = projects.filter(p => p.agentStatus === "CLOSED");
  
  const totalEarned = projects.reduce((sum, p) => sum + (p.clientInvoiceAmount || 0), 0);
  const totalPaid = projects.reduce((sum, p) => sum + (p.agentPaid || 0), 0);
  const totalRemaining = totalEarned - totalPaid;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Toaster />
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Agent Process</h1>
              <p className="text-sm text-gray-500">Manage agent projects and payments</p>
            </div>
          </div>
        </div>

        {/* Agent Selector */}
        <div className="bg-white rounded-xl border shadow-sm p-4 mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Select Agent</label>
          <select 
            value={selectedAgent || ""} 
            onChange={(e) => setSelectedAgent(Number(e.target.value))}
            className="w-full md:w-64 border rounded-lg px-4 py-2"
          >
            {agents.map(a => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>

        {selectedAgentData && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-purple-100 p-2 rounded-lg">
                    <Briefcase className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Active Projects</p>
                    <p className="text-2xl font-bold">{agentProjects.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Earned</p>
                    <p className="text-2xl font-bold">${totalEarned.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Paid to Agent</p>
                    <p className="text-2xl font-bold">${totalPaid.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl border shadow-sm p-5">
                <div className="flex items-center gap-3">
                  <div className="bg-amber-100 p-2 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Remaining</p>
                    <p className="text-2xl font-bold">${totalRemaining.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Projects */}
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b">
                <h2 className="font-semibold text-gray-900">Active Projects</h2>
              </div>
              {loading ? (
                <div className="p-8 text-center text-gray-500">Loading...</div>
              ) : agentProjects.length === 0 ? (
                <div className="p-8 text-center text-gray-500">No active projects</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Project</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Client</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Status</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Invoice Amount</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Paid</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Remaining</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Notes</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {agentProjects.map(p => {
                      const remaining = (p.clientInvoiceAmount || 0) - (p.agentPaid || 0);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">{p.name}</td>
                          <td className="px-5 py-3">{p.client?.name || "-"}</td>
                          <td className="px-5 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(p.agentStatus || "OPEN")}`}>
                              {p.agentStatus || "OPEN"}
                            </span>
                          </td>
                          <td className="px-5 py-3">${(p.clientInvoiceAmount || 0).toLocaleString()}</td>
                          <td className="px-5 py-3">${(p.agentPaid || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 font-medium">${remaining.toLocaleString()}</td>
                          <td className="px-5 py-3 text-sm text-gray-500">{p.agentNotes || "-"}</td>
                          <td className="px-5 py-3">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => openStatusEdit(p)}
                                className="text-gray-600 hover:underline text-xs"
                              >
                                Edit
                              </button>
                              {p.agentStatus === "OPEN" && (
                                <button 
                                  onClick={() => updateStatus(p.id, "IN_PROGRESS")}
                                  className="text-blue-600 hover:underline text-xs"
                                >
                                  Start
                                </button>
                              )}
                              {p.agentStatus === "IN_PROGRESS" && (
                                <button 
                                  onClick={() => { setClosingProject(p); setInvoiceAmount(String(p.clientInvoiceAmount || 0)); setAgentFees(String(p.agentFees || 0)); setShowCloseModal(true); }}
                                  className="text-green-600 hover:underline text-xs"
                                >
                                  Close
                                </button>
                              )}
                              {p.agentStatus === "IN_PROGRESS" && remaining > 0 && (
                                <button 
                                  onClick={() => { setPaymentProject(p); setShowPaymentModal(true); }}
                                  className="text-purple-600 hover:underline text-xs"
                                >
                                  Pay
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Closed Projects */}
            {closedProjects.length > 0 && (
              <div className="bg-white rounded-xl border shadow-sm overflow-hidden mt-6">
                <div className="px-5 py-4 border-b bg-gray-50">
                  <h2 className="font-semibold text-gray-900">Closed Projects</h2>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Project</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Client</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Invoice Amount</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Agent Fees</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Office Profit</th>
                      <th className="px-5 py-3 text-left font-medium text-gray-500">Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {closedProjects.map(p => {
                      const profit = (p.clientInvoiceAmount || 0) - (p.agentFees || 0);
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-5 py-3 font-medium">{p.name}</td>
                          <td className="px-5 py-3">{p.client?.name || "-"}</td>
                          <td className="px-5 py-3">${(p.clientInvoiceAmount || 0).toLocaleString()}</td>
                          <td className="px-5 py-3">${(p.agentFees || 0).toLocaleString()}</td>
                          <td className="px-5 py-3 font-medium text-green-600">${profit.toLocaleString()}</td>
                          <td className="px-5 py-3">${(p.agentPaid || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Close Project Modal */}
        {showCloseModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Close Project</h2>
              <p className="text-sm text-gray-500 mb-4">Project: {closingProject?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Total Invoice Amount</label>
                  <input 
                    type="number" 
                    value={invoiceAmount}
                    onChange={(e) => setInvoiceAmount(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agent Fees (Office keeps this)</label>
                  <input 
                    type="number" 
                    value={agentFees}
                    onChange={(e) => setAgentFees(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    id="clientWillPay"
                    checked={clientWillPay}
                    onChange={(e) => setClientWillPay(e.target.checked)}
                  />
                  <label htmlFor="clientWillPay" className="text-sm">Client will pay directly to agent</label>
                </div>
                {invoiceAmount && agentFees && (
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      Office Profit: <strong>${(parseFloat(invoiceAmount) - parseFloat(agentFees)).toLocaleString()}</strong>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowCloseModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button onClick={closeProject} className="flex-1 py-2 bg-green-600 text-white rounded-lg">Close Project</button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Modal */}
        {showPaymentModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Pay Agent</h2>
              <p className="text-sm text-gray-500 mb-4">Project: {paymentProject?.name}</p>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Amount</label>
                <input 
                  type="number" 
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="0.00"
                />
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowPaymentModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button onClick={payAgent} className="flex-1 py-2 bg-purple-600 text-white rounded-lg">Record Payment</button>
              </div>
            </div>
          </div>
        )}

        {/* Status Edit Modal */}
        {showStatusModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h2 className="text-lg font-semibold mb-4">Edit Status</h2>
              <p className="text-sm text-gray-500 mb-4">Project: {statusProject?.name}</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                  >
                    <option value="OPEN">Open</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="CLOSED">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes / Comments</label>
                  <textarea 
                    value={statusNotes}
                    onChange={(e) => setStatusNotes(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Add notes..."
                    rows={3}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowStatusModal(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button onClick={saveStatus} className="flex-1 py-2 bg-purple-600 text-white rounded-lg">Save</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}