"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast, Toaster } from "react-hot-toast";
import { fetchAuth } from "@/lib/fetchAuth";
import { getAuth } from "@/lib/auth";

interface Client {
  id: number;
  name: string;
}

interface Project {
  id: number;
  code: string;
  name: string;
  status: string;
  advanceAmount: number | null;
  advanceCurrency: string | null;
  advanceTotals?: { currency: string; total: number }[];
  client: Client;
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [tempName, setTempName] = useState("");
  const [tempStatus, setTempStatus] = useState("OPEN");
  const [tempAmount, setTempAmount] = useState("");
  const [tempCurrency, setTempCurrency] = useState("USD");
  const [error, setError] = useState<string | null>(null);
  const [filterCode, setFilterCode] = useState("");
  const [filterName, setFilterName] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();

  /* ---------- helpers ---------- */
  const fetchProjects = async () => {
    try {
      const res = await fetchAuth("/api/projects");
      if (!res.ok) throw new Error("Failed to fetch");
      setProjects(await res.json());
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (p: Project) => {
    setEditingId(p.id);
    setTempName(p.name);
    setTempStatus(p.status);
    setTempAmount(p.advanceAmount !== null ? String(p.advanceAmount) : "");
    setTempCurrency(p.advanceCurrency ?? "USD");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempName("");
  };

  const saveEdit = async (id: number) => {
    if (!tempName.trim()) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAuth()}`,
        },
        body: JSON.stringify({
          name: tempName.trim(),
          status: tempStatus,
          advanceAmount: tempAmount ? parseFloat(tempAmount) : null,
          advanceCurrency: tempCurrency,
        }),
      });
      if (!res.ok) throw new Error("Failed update");
      toast.success("Project updated");
      setProjects((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
              ...p,
              name: tempName.trim(),
              status: tempStatus,
              advanceAmount: tempAmount ? parseFloat(tempAmount) : null,
              advanceCurrency: tempCurrency,
            }
            : p
        )
      );
    } catch {
      toast.error("Update failed");
    } finally {
      cancelEdit();
    }
  };

  const deleteProject = async (id: number) => {
    if (!confirm("Delete this project?")) return;
    try {
      const res = await fetchAuth(`/api/projects/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Deleted");
      fetchProjects();
    } catch {
      toast.error("Deletion failed");
    }
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
      const res = await fetch('/api/projects/import', {
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

      toast.success(`Imported ${data.count} projects successfully.`);
      if (data.errorCount > 0) {
        toast.error(`${data.errorCount} rows failed to import. Check console.`);
        console.error("Import errors:", data.errors);
      }
      fetchProjects();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  /* -------------------------------- */

  useEffect(() => {
    fetchProjects();
  }, []);

  const visibleProjects = projects.filter((p) => {
    const codeMatch = filterCode
      ? p.code.toLowerCase().includes(filterCode.toLowerCase())
      : true;
    const nameMatch = filterName
      ? p.name.toLowerCase().includes(filterName.toLowerCase())
      : true;
    return codeMatch && nameMatch;
  });

  return (
    <div className="container mx-auto p-6">
      <Toaster />
      {/* header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-sm text-gray-600">Manage your projects</p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/templates/projects_import_template.csv?v=${Date.now()}`}
            download
            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
          >
            <svg className="fill-current w-4 h-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M13 8V2H7v6H2l8 8 8-8h-5zM0 18h20v2H0v-2z" /></svg>
            Template
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
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded inline-flex items-center"
          >
            {isImporting ? 'Importing...' : 'Import CSV'}
          </button>

          <button
            onClick={() => router.push("/projects/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            New Project
          </button>
        </div>
      </div>

      {/* filters + states */}
      {loading && <p>Loading…</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && !error && (
        <div className="mb-4 flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium mb-1">Filter by Code</label>
            <input
              value={filterCode}
              onChange={(e) => setFilterCode(e.target.value)}
              className="border rounded px-2 py-1 text-sm min-w-[140px]"
              placeholder="e.g. P0001"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Filter by Name</label>
            <input
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
              className="border rounded px-2 py-1 text-sm min-w-[200px]"
              placeholder="Project name"
            />
          </div>
        </div>
      )}

      {/* table */}
      {!loading && !error && (
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Client",
                    "Code",
                    "Project Name",
                    "Status",
                    "Advance Payment",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                    >
                      {h}
                    </th>
                  ))}
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visibleProjects.map((p) => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">{p.client.name}</td>
                    <td className="px-6 py-4 font-mono text-sm">{p.code}</td>
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <input
                          value={tempName}
                          onChange={(e) => setTempName(e.target.value)}
                          className="border rounded px-2 py-1 text-sm w-full"
                        />
                      ) : (
                        <Link
                          href={`/projects/${p.id}`}
                          className="text-blue-600 hover:underline"
                        >
                          {p.name}
                        </Link>
                      )}
                    </td>
                    {/* status */}
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <select
                          value={tempStatus}
                          onChange={(e) => setTempStatus(e.target.value)}
                          className="border rounded px-2 py-1 text-xs"
                        >
                          {["OPEN", "IN_PROGRESS", "CLOSED"].map((s) => (
                            <option key={s}>{s}</option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${p.status === "OPEN"
                            ? "bg-green-100 text-green-800"
                            : p.status === "CLOSED"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                            }`}
                        >
                          {p.status}
                        </span>
                      )}
                    </td>
                    {/* advance */}
                    <td className="px-6 py-4">
                      {editingId === p.id ? (
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            step="0.01"
                            value={tempAmount}
                            onChange={(e) => setTempAmount(e.target.value)}
                            className="border rounded px-2 py-1 w-24 text-sm"
                          />
                          <select
                            value={tempCurrency}
                            onChange={(e) => setTempCurrency(e.target.value)}
                            className="border rounded px-1 py-1 text-xs"
                          >
                            {[
                              "USD",
                              "EUR",
                              "GBP",
                              "SAR",
                              "EGP",
                              "AED",
                              "QAR",
                              "KWD",
                              "OMR",
                              "JPY",
                              "CNY",
                              "INR",
                            ].map((c) => (
                              <option key={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      ) : p.advanceTotals && p.advanceTotals.length ? (
                        p.advanceTotals
                          .map((t) => `${t.total} ${t.currency}`)
                          .join(", ")
                      ) : p.advanceAmount !== null ? (
                        `${p.advanceAmount} ${p.advanceCurrency ?? ""}`
                      ) : (
                        "—"
                      )}
                    </td>

                    {/* actions */}
                    <td className="px-6 py-4 text-right text-sm">
                      {editingId === p.id ? (
                        <>
                          <button
                            onClick={() => saveEdit(p.id)}
                            className="text-green-600 hover:underline mr-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:underline"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(p)}
                            className="text-blue-600 hover:underline mr-4"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteProject(p.id)}
                            className="text-red-600 hover:underline"
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {projects.length === 0 && (
              <p className="text-center py-6 text-sm text-gray-600">
                No projects found.
              </p>
            )}
          </div>
        </div>
      )}

      <p className="mt-6 text-sm text-gray-600">
        <Link href="/dashboard" className="text-blue-600 underline">
          ← Back to Dashboard
        </Link>
      </p>
    </div>
  );
}