'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { toast, Toaster } from 'react-hot-toast';
import { getAuth } from '@/lib/auth';
import { Client } from '@/types/client';

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tempName, setTempName] = useState('');
  const [tempContactPerson, setTempContactPerson] = useState('');
  const [tempEmail, setTempEmail] = useState('');
  const [tempPhone, setTempPhone] = useState('');
  const [tempAddress, setTempAddress] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempVatCode, setTempVatCode] = useState('');
  const [tempCountry, setTempCountry] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const token = getAuth();

  // ---------------- API helpers ----------------
  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch clients');
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;
    try {
      const auth = getAuth();
      if (!auth) {
        toast.error('Not logged in');
        return;
      }
      const res = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth}` },
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to delete (HTTP ${res.status})`);
      }
      toast.success('Client deleted');
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || 'Delete failed');
    }
  };

  const saveEdit = async (id: string) => {
    if (!tempName.trim()) return;
    const payload: Record<string, string> = { name: tempName.trim() };
    if (tempContactPerson.trim()) payload.contactPerson = tempContactPerson.trim();
    if (tempEmail.trim()) payload.contactEmail = tempEmail.trim();
    if (tempPhone.trim()) payload.phone = tempPhone.trim();
    if (tempAddress.trim()) payload.address = tempAddress.trim();
    if (tempCity.trim()) payload.city = tempCity.trim();
    if (tempVatCode.trim()) payload.vatCode = tempVatCode.trim();
    if (tempCountry.trim()) payload.country = tempCountry.trim();
    try {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Failed to update (HTTP ${res.status})`);
      }
      toast.success('Client updated');
      setClients(prev => prev.map(c => c.id === id ? {
        ...c,
        name: tempName.trim(),
        contactPerson: tempContactPerson.trim(),
        contactEmail: tempEmail.trim(),
        phone: tempPhone.trim(),
        address: tempAddress.trim(),
        city: tempCity.trim(),
        vatCode: tempVatCode.trim(),
        country: tempCountry.trim()
      } : c));
    } catch (err) {
      console.error(err);
      toast.error('Update failed');
    } finally {
      cancelEdit();
    }
  };

  useEffect(() => {
    fetchClients();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startEdit = (c: Client) => {
    setEditingId(c.id);
    setTempName(c.name);
    setTempContactPerson(c.contactPerson || "");
    setTempEmail(c.contactEmail || "");
    setTempPhone(c.phone || "");
    setTempAddress(c.address || "");
    setTempCity(c.city || "");
    setTempVatCode(c.vatCode || "");
    setTempCountry(c.country || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setTempName('');
    setTempContactPerson('');
    setTempEmail('');
    setTempPhone('');
    setTempAddress('');
    setTempCity('');
    setTempVatCode('');
    setTempCountry('');
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
      const res = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Import failed');
      }

      toast.success(`Imported ${data.count} clients successfully.`);
      if (data.errors > 0) {
        toast.error(`${data.errors} rows failed to import. Check console.`);
      }
      fetchClients();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to import');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredClients = clients.filter(c => {
    const s = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(s) ||
      (c.code || "").toLowerCase().includes(s) ||
      (c.contactPerson || "").toLowerCase().includes(s) ||
      (c.contactEmail || "").toLowerCase().includes(s)
    );
  });

  return (
    <div className="container mx-auto p-6">
      <Toaster />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clients</h1>
        <div className="flex gap-2">
          <a
            href={`/templates/clients_import_template.csv?v=${Date.now()}`}
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
            onClick={() => router.push('/dashboard/clients/new')}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Client
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, code, or contact person..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/50 border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
          />
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      )}

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4">
          <h3 className="font-medium text-red-800">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Person
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  City
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  VAT Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredClients.map((client) => (
                <tr key={client.id} className="hover:bg-gray-50">
                  {/* Code */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                    {client.code || "-"}
                  </td>
                  {/* Name cell */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {editingId === client.id ? (
                      <input
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.name
                    )}
                  </td>

                  {/* Contact Person */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempContactPerson}
                        onChange={(e) => setTempContactPerson(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.contactPerson || 'N/A'
                    )}
                  </td>

                  {/* Email */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempEmail}
                        onChange={(e) => setTempEmail(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.contactEmail || 'N/A'
                    )}
                  </td>

                  {/* Address */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempAddress}
                        onChange={(e) => setTempAddress(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.address || 'N/A'
                    )}
                  </td>

                  {/* City */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempCity}
                        onChange={(e) => setTempCity(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.city || 'N/A'
                    )}
                  </td>

                  {/* VAT Code */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempVatCode}
                        onChange={(e) => setTempVatCode(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.vatCode || 'N/A'
                    )}
                  </td>

                  {/* Country */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempCountry}
                        onChange={(e) => setTempCountry(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.country || 'N/A'
                    )}
                  </td>

                  {/* Phone */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {editingId === client.id ? (
                      <input
                        value={tempPhone}
                        onChange={(e) => setTempPhone(e.target.value)}
                        className="border rounded px-2 py-1 text-sm w-full"
                      />
                    ) : (
                      client.phone || 'N/A'
                    )}
                  </td>

                  {/* Created */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {client.createdAt ? new Date(client.createdAt).toLocaleDateString() : '-'}
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === client.id ? (
                      <>
                        <button
                          onClick={() => saveEdit(client.id)}
                          className="text-green-600 hover:text-green-800 mr-2"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href={`/clients/${client.id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <button
                          onClick={() => startEdit(client)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="text-red-600 hover:text-red-900"
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

          {filteredClients.length === 0 && (
            <p className="text-center py-6 text-sm text-gray-600">
              No clients found matching your search.
            </p>
          )}
        </div>
      )}
    </div>
  );
}